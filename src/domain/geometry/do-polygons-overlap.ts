import type { WirePoint } from '../types';

function projectOntoAxis(points: readonly WirePoint[], axis: WirePoint) {
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const point of points) {
    const projection = point.xU * axis.xU + point.yU * axis.yU;
    minimum = Math.min(minimum, projection);
    maximum = Math.max(maximum, projection);
  }
  return { minimum, maximum };
}

// Separating axes for convex polygons; touching boundaries have no positive-area overlap.
export function doPolygonsOverlap(input: {
  readonly first: readonly WirePoint[];
  readonly second: readonly WirePoint[];
}): boolean {
  for (const polygon of [input.first, input.second]) {
    for (const [index, point] of polygon.entries()) {
      const next = polygon[(index + 1) % polygon.length];
      if (next === undefined) {
        return false;
      }
      const length = Math.hypot(next.xU - point.xU, next.yU - point.yU);
      if (length === 0) {
        return false;
      }
      const axis = { xU: (point.yU - next.yU) / length, yU: (next.xU - point.xU) / length };
      const first = projectOntoAxis(input.first, axis);
      const second = projectOntoAxis(input.second, axis);
      if (
        Math.min(first.maximum, second.maximum) - Math.max(first.minimum, second.minimum) <=
        1e-8
      ) {
        return false;
      }
    }
  }
  return input.first.length > 0 && input.second.length > 0;
}
