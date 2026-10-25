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
};

export function getGroupedOutputPositions(
  project: Project,
): Result<readonly OutputPosition[], string> {
  const outputs: OutputPosition[] = [];
  const bounds = project.keys.map((key) => ({
    half: key.half ?? 'left',
    points: getKeyCorners(key),
  }));
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
    const block = createBlock(terminals, { right, edge, top });
    const placed = placeBlock(block, {
      bounds: bounds.map((entry) => getBounds(entry.points)),
      occupied: [...getManualOutputs(project), ...outputs],
      right,
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
      at: { ...output.at, xU: output.at.xU + step * (input.right ? 0.5 : -0.5) },
    }));
    if (candidate.every(({ at }) => isClear(at, input))) {
      return { ok: true, value: candidate };
    }
  }
  return {
    ok: false,
    error: 'No clear space for grouped wiring outputs. Move the halves apart and retry.',
  };
}

function isClear(
  at: WirePoint,
  input: {
    readonly bounds: readonly Bounds[];
    readonly occupied: readonly OutputPosition[];
    readonly right: boolean;
  },
) {
  const hitsKey = input.bounds.some(
    (bounds) =>
      at.xU + (input.right ? 4 : 0) > bounds.minX - 1 &&
      at.xU - (input.right ? 0 : 4) < bounds.maxX + 1 &&
      at.yU + 0.25 > bounds.minY - 1 &&
      at.yU - 0.25 < bounds.maxY + 1,
  );
  const minX = at.xU - (input.right ? 0 : 4);
  const maxX = at.xU + (input.right ? 4 : 0);
  return (
    !hitsKey &&
    !input.occupied.some(
      (output) =>
        maxX > output.at.xU - (output.right ? 0 : 4) - 0.5 &&
        minX < output.at.xU + (output.right ? 4 : 0) + 0.5 &&
        Math.abs(output.at.yU - at.yU) < 0.5,
    )
  );
}

function createBlock(
  terminals: readonly WiringTerminal[],
  { right, edge, top }: { readonly right: boolean; readonly edge: number; readonly top: number },
) {
  const outward = right ? 5 : -5;
  return terminals.map((terminal) => ({
    terminalId: terminal.id,
    right,
    at: {
      xU: edge + (right ? 1 : -1) + (terminal.kind === 'col' ? outward : 0),
      yU:
        top +
        terminals
          .filter((other) => other.kind === terminal.kind)
          .findIndex((other) => other.id === terminal.id),
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
