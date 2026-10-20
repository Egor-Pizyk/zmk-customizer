import type { WirePoint } from '@domain';

/** A shared bend is continuous; a bend where either conductor diverges is a boundary. */
export function getOverlapBoundaries(
  path: readonly WirePoint[],
  targets: readonly (readonly WirePoint[])[],
): readonly WirePoint[] {
  return path.filter((at, index) => {
    const before = path[index - 1];
    const after = path[index + 1];
    return (
      before === undefined ||
      after === undefined ||
      !hasOverlap(before, at, targets) ||
      !hasOverlap(at, after, targets)
    );
  });
}

function hasOverlap(from: WirePoint, to: WirePoint, targets: readonly (readonly WirePoint[])[]) {
  return targets.some((path) =>
    path.some((start, index) => {
      const end = path[index + 1];
      if (end === undefined) {
        return false;
      }
      if (from.yU === to.yU && start.yU === from.yU && end.yU === from.yU) {
        return (
          Math.min(Math.max(from.xU, to.xU), Math.max(start.xU, end.xU)) >
          Math.max(Math.min(from.xU, to.xU), Math.min(start.xU, end.xU))
        );
      }
      return (
        from.xU === to.xU &&
        start.xU === from.xU &&
        end.xU === from.xU &&
        Math.min(Math.max(from.yU, to.yU), Math.max(start.yU, end.yU)) >
          Math.max(Math.min(from.yU, to.yU), Math.min(start.yU, end.yU))
      );
    }),
  );
}
