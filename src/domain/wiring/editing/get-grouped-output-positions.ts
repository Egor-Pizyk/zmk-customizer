import { getKeyCorners } from '@domain/geometry';
import { getRetainedWires } from './get-retained-wires';
import type { Project, Result, WirePoint, WiringTerminal } from '@domain';

type Bounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

type OutputPosition = {
  readonly terminalId: string;
  readonly at: WirePoint;
  readonly right: boolean;
  readonly up?: boolean;
};

export function getGroupedOutputPositions(
  project: Project,
): Result<readonly OutputPosition[], string> {
  const outputs: OutputPosition[] = [];
  const bounds = getKeyBounds(project);
  for (const half of ['left', 'right'] as const) {
    const own = bounds.filter(
      (entry) => project.wiring?.topology !== 'split' || entry.half === half,
    );
    const points = own.flatMap((entry) => entry.points);
    if (points.length === 0 || (half === 'right' && project.wiring?.topology !== 'split')) {
      continue;
    }
    const right = half === 'right' && project.wiring?.topology === 'split';
    const outer = getBounds(points);
    const edge = right ? outer.maxX : outer.minX;
    const top = outer.minY;
    const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
    const placed = placeHalf(project, terminals, {
      right,
      edge,
      top,
      left: outer.minX,
      bounds: bounds.map((entry) => getBounds(entry.points)),
      previous: outputs,
    });
    if (!placed.ok) {
      return placed;
    }
    outputs.push(...placed.value);
  }
  return { ok: true, value: outputs };
}

function placeHalf(
  project: Project,
  terminals: readonly WiringTerminal[],
  input: {
    readonly right: boolean;
    readonly edge: number;
    readonly top: number;
    readonly left: number;
    readonly bounds: readonly Bounds[];
    readonly previous: readonly OutputPosition[];
  },
): Result<readonly OutputPosition[], string> {
  const outputs: OutputPosition[] = [];
  for (const kind of ['row', 'col'] as const) {
    const block = createBlock(
      terminals.filter((terminal) => terminal.kind === kind),
      {
        ...input,
        up: kind === 'row',
      },
    );
    const placed = placeBlock(block, {
      bounds: input.bounds,
      occupied: [...getManualOutputs(project), ...input.previous, ...outputs],
      right: input.right,
    });
    if (!placed.ok) {
      return placed;
    }
    outputs.push(...placed.value);
  }
  return { ok: true, value: outputs };
}

function placeBlock(
  block: readonly OutputPosition[],
  input: {
    readonly bounds: readonly Bounds[];
    readonly occupied: readonly OutputPosition[];
    readonly right: boolean;
  },
): Result<readonly OutputPosition[], string> {
  for (let step = 0; step < 4096; step += 1) {
    const candidate = block.map((output) => ({
      ...output,
      at: {
        xU: output.at.xU + (output.up === true ? 0 : step * (input.right ? 0.5 : -0.5)),
        yU: output.at.yU - (output.up === true ? step * 0.5 : 0),
      },
    }));
    if (candidate.every((output) => isClear(output, input))) {
      return { ok: true, value: candidate };
    }
  }
  return {
    ok: false,
    error: 'No clear space for grouped wiring outputs. Move the halves apart and retry.',
  };
}

function isClear(
  output: OutputPosition,
  input: { readonly bounds: readonly Bounds[]; readonly occupied: readonly OutputPosition[] },
) {
  const box = getOutputBounds(output);
  return (
    !input.bounds.some((bounds) => overlaps(box, bounds, 1)) &&
    !input.occupied.some((other) => overlaps(box, getOutputBounds(other), 0.5))
  );
}

function overlaps(first: Bounds, second: Bounds, gap: number) {
  return (
    first.maxX > second.minX - gap &&
    first.minX < second.maxX + gap &&
    first.maxY > second.minY - gap &&
    first.minY < second.maxY + gap
  );
}

function getOutputBounds(output: OutputPosition): Bounds {
  const { at, right, up } = output;
  if (up === true) {
    return { minX: at.xU - 0.25, maxX: at.xU + 0.25, minY: at.yU - 4, maxY: at.yU };
  }
  return {
    minX: at.xU - (right ? 0 : 4),
    maxX: at.xU + (right ? 4 : 0),
    minY: at.yU - 0.25,
    maxY: at.yU + 0.25,
  };
}

function createBlock(
  terminals: readonly WiringTerminal[],
  input: {
    readonly right: boolean;
    readonly edge: number;
    readonly top: number;
    readonly left: number;
    readonly up: boolean;
  },
) {
  return terminals.map((terminal, index) => ({
    terminalId: terminal.id,
    right: input.right,
    up: input.up,
    at: {
      xU: input.up ? input.left + index : input.edge + (input.right ? 1 : -1),
      yU: input.up ? input.top - 1 : input.top + index,
    },
  }));
}

function getManualOutputs(project: Project): readonly OutputPosition[] {
  return getRetainedWires(project).flatMap((wire) =>
    [wire.start, wire.end].flatMap((end) =>
      end.kind === 'free' ? [{ terminalId: wire.id, at: end.at, right: true }] : [],
    ),
  );
}

function getBounds(points: readonly WirePoint[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.xU);
    minY = Math.min(minY, point.yU);
    maxX = Math.max(maxX, point.xU);
    maxY = Math.max(maxY, point.yU);
  }
  return { minX, minY, maxX, maxY };
}

function getKeyBounds(project: Project) {
  return project.keys.map((key) => ({ half: key.half ?? 'left', points: getKeyCorners(key) }));
}
