import type { WirePoint } from '@domain';
import type { RelationLocation, RelationPath } from './electrical-relation-types';

export function pathLength(points: readonly WirePoint[]): number {
  let length = 0;
  for (const [index, point] of points.entries()) {
    const next = points[index + 1];
    if (next !== undefined) {
      length += Math.abs(next.xU - point.xU) + Math.abs(next.yU - point.yU);
    }
  }
  return length;
}

export function arcAt(points: readonly WirePoint[], at: WirePoint): number | undefined {
  let travelled = 0;
  for (const [index, from] of points.entries()) {
    const to = points[index + 1] ?? from;
    if (onSpan({ from, to, at })) {
      return travelled + Math.abs(at.xU - from.xU) + Math.abs(at.yU - from.yU);
    }
    travelled += Math.abs(to.xU - from.xU) + Math.abs(to.yU - from.yU);
  }
  return undefined;
}

export function locate(
  paths: readonly RelationPath[],
  input: { readonly wireId: string; readonly at: WirePoint },
): RelationLocation | undefined {
  for (const path of paths) {
    if (path.wireId !== input.wireId) {
      continue;
    }
    const arc = arcAt(path.points, input.at);
    if (arc !== undefined) {
      return { path, arc };
    }
  }
  return undefined;
}

export function onSpan({
  from,
  to,
  at,
}: {
  readonly from: WirePoint;
  readonly to: WirePoint;
  readonly at: WirePoint;
}): boolean {
  return (
    (from.xU === to.xU || from.yU === to.yU) &&
    at.xU >= Math.min(from.xU, to.xU) - 1e-7 &&
    at.xU <= Math.max(from.xU, to.xU) + 1e-7 &&
    at.yU >= Math.min(from.yU, to.yU) - 1e-7 &&
    at.yU <= Math.max(from.yU, to.yU) + 1e-7
  );
}

export function compareText(first: string, second: string): number {
  return first < second ? -1 : Number(first > second);
}

export function pointAtArc(path: RelationPath, arc: number): WirePoint {
  if (arc <= 0) {
    return path.points[0] ?? { xU: 0, yU: 0 };
  }
  if (arc >= path.length) {
    return path.points.at(-1) ?? { xU: 0, yU: 0 };
  }
  let remaining = arc;
  for (const [index, from] of path.points.entries()) {
    const to = path.points[index + 1] ?? from;
    const length = Math.abs(to.xU - from.xU) + Math.abs(to.yU - from.yU);
    if (remaining <= length) {
      return {
        xU: from.xU + Math.sign(to.xU - from.xU) * remaining,
        yU: from.yU + Math.sign(to.yU - from.yU) * remaining,
      };
    }
    remaining -= length;
  }
  return path.points.at(-1) ?? { xU: 0, yU: 0 };
}
