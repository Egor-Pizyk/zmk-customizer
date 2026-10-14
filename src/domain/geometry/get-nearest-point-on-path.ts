import { roundU } from './round-u';
import type { WirePoint } from '@domain';

function clamp(value: number, bounds: readonly [number, number]): number {
  return Math.min(Math.max(value, Math.min(bounds[0], bounds[1])), Math.max(bounds[0], bounds[1]));
}

// Paths are orthogonal, so the nearest point on a segment clamps one coordinate and keeps the other.
export function getNearestPointOnPath(
  path: readonly WirePoint[],
  point: WirePoint,
): WirePoint | undefined {
  let nearest: WirePoint | undefined = path[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const [index, from] of path.entries()) {
    const to = path[index + 1] ?? from;
    const candidate = {
      xU: roundU(clamp(point.xU, [from.xU, to.xU])),
      yU: roundU(clamp(point.yU, [from.yU, to.yU])),
    };
    const distance = Math.hypot(candidate.xU - point.xU, candidate.yU - point.yU);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }
  return nearest;
}
