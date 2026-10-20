import { getKeyCorners } from '@domain/geometry';
import type { Project, Result, WirePoint, WiringTerminal } from '@domain';

type Bounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export function getOutputPosition(
  project: Project,
  input: {
    readonly terminal: WiringTerminal;
    readonly index: number;
    readonly occupied?: readonly WirePoint[];
  },
): Result<WirePoint, string> {
  const bounds = project.keys.map((key) => ({
    half: key.half ?? 'left',
    ...getBounds(getKeyCorners(key)),
  }));
  const own = bounds.filter(
    (entry) => project.wiring?.topology !== 'split' || entry.half === input.terminal.half,
  );
  const outer = getBounds(
    own.flatMap((entry) => [
      { xU: entry.minX, yU: entry.minY },
      { xU: entry.maxX, yU: entry.maxY },
    ]),
  );
  const { at, horizontal, towardRight, below } = createInitialPosition(project, {
    ...input,
    outer,
    others: bounds.filter((entry) => !own.includes(entry)),
  });
  return findClearPosition({
    at,
    horizontal,
    towardRight,
    below,
    bounds,
    occupied: input.occupied ?? [],
  });
}

function findClearPosition(input: {
  readonly at: WirePoint;
  readonly horizontal: boolean;
  readonly towardRight: boolean;
  readonly below: boolean;
  readonly bounds: readonly Bounds[];
  readonly occupied: readonly WirePoint[];
}): Result<WirePoint, string> {
  const { horizontal, towardRight, below, bounds } = input;
  const at = { ...input.at };
  for (let attempt = 0; attempt < 4096; attempt += 1) {
    if (
      !bounds.some((entry) => overlapsLabel(at, entry)) &&
      !input.occupied.some(
        (other) => Math.abs(at.xU - other.xU) < 4.5 && Math.abs(at.yU - other.yU) < 0.5,
      )
    ) {
      return { ok: true, value: at };
    }
    if (horizontal) {
      at.xU += towardRight ? 0.5 : -0.5;
    } else {
      at.yU += below ? 0.5 : -0.5;
    }
  }
  return {
    ok: false,
    error: 'No clear space for wiring output labels. Move the halves apart and retry.',
  };
}

function getBounds(points: readonly WirePoint[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.xU);
    maxX = Math.max(maxX, point.xU);
    minY = Math.min(minY, point.yU);
    maxY = Math.max(maxY, point.yU);
  }
  return points.length === 0 ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : { minX, minY, maxX, maxY };
}

function overlapsLabel(at: WirePoint, bounds: Bounds) {
  return (
    at.xU + 4 > bounds.minX - 1 &&
    at.xU < bounds.maxX + 1 &&
    at.yU + 0.25 > bounds.minY - 1 &&
    at.yU - 0.25 < bounds.maxY + 1
  );
}

function chooseBottom(own: Bounds, others: readonly Bounds[]) {
  let above = Infinity;
  let below = Infinity;
  for (const other of others) {
    if (other.maxX < own.minX || other.minX > own.maxX) {
      continue;
    }
    if (other.minY < own.minY) {
      above = Math.min(above, Math.max(0, own.minY - other.maxY));
    }
    if (other.maxY > own.maxY) {
      below = Math.min(below, Math.max(0, other.minY - own.maxY));
    }
  }
  return below > above;
}

function createInitialPosition(
  project: Project,
  input: {
    readonly terminal: WiringTerminal;
    readonly index: number;
    readonly outer: Bounds;
    readonly others: readonly Bounds[];
  },
) {
  const outer = input.outer;
  const horizontal = input.terminal.kind === 'row' || input.terminal.kind === 'input';
  const towardRight = project.wiring?.topology === 'split' && input.terminal.half === 'right';
  const below = !horizontal && chooseBottom(outer, input.others);
  const at = {
    xU: horizontal ? outer.minX - 5 - input.index * 0.07 : outer.minX + input.index * 4.5,
    yU: horizontal ? outer.minY + input.index * 0.5 : outer.minY - 1,
  };
  if (horizontal && towardRight) {
    at.xU = outer.maxX + 1 + input.index * 0.07;
  }
  if (below) {
    at.yU = outer.maxY + 1;
  }
  return { at, horizontal, towardRight, below };
}
