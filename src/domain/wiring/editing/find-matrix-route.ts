import { roundU } from '@domain/geometry';
import type { WirePoint } from '@domain';
import { getRoutePathCost } from './get-route-path-cost';
import type { RouteContext } from './get-route-path-cost';

export function findMatrixRoute(
  start: WirePoint,
  end: WirePoint,
  context: RouteContext,
): readonly WirePoint[] | undefined {
  let best: readonly WirePoint[] | undefined;
  let bestCost = Infinity;
  for (const path of getRouteCandidates(start, end, context)) {
    const simplified = simplifyPath(path);
    const cost = getRoutePathCost(simplified, context);
    if (cost < bestCost) {
      best = simplified;
      bestCost = cost;
      if (cost <= Math.abs(start.xU - end.xU) + Math.abs(start.yU - end.yU) + 0.05) {
        return best;
      }
    }
  }
  return best;
}

function* getRouteCandidates(start: WirePoint, end: WirePoint, context: RouteContext) {
  yield [start, { xU: end.xU, yU: start.yU }, end];
  yield [start, { xU: start.xU, yU: end.yU }, end];
  for (const offset of [0.08, -0.08, 0.16, -0.16, 0.32, -0.32]) {
    const xU = roundU(start.xU + offset);
    const yU = roundU(start.yU + offset);
    yield [start, { xU, yU: start.yU }, { xU, yU: end.yU }, end];
    yield [start, { xU: start.xU, yU }, { xU: end.xU, yU }, end];
  }
  yield* getDetourPaths(start, end, context);
}

function* getDetourPaths(start: WirePoint, end: WirePoint, context: RouteContext) {
  const ys = [
    ...new Set([
      start.yU,
      end.yU,
      ...context.pins.map((pin) => pin.at.yU),
      ...context.areas.flatMap((area) => [area.minY, area.maxY]),
    ]),
  ];
  const lanes = ys
    .flatMap((yU) => [roundU(yU - 0.08), roundU(yU + 0.08)])
    .toSorted(
      (first, second) =>
        Math.abs(first - start.yU) +
        Math.abs(first - end.yU) -
        Math.abs(second - start.yU) -
        Math.abs(second - end.yU),
    );
  for (const yU of lanes) {
    for (const offset of [0.08, -0.08, 0.16, -0.16, 0.32, -0.32]) {
      const firstX = roundU(start.xU + offset);
      const lastX = roundU(end.xU + offset);
      yield [
        start,
        { xU: firstX, yU: start.yU },
        { xU: firstX, yU },
        { xU: lastX, yU },
        { xU: lastX, yU: end.yU },
        end,
      ];
    }
  }
}

function simplifyPath(points: readonly WirePoint[]) {
  const path: WirePoint[] = [];
  for (const point of points) {
    const previous = path.at(-1);
    if (previous?.xU === point.xU && previous.yU === point.yU) {
      continue;
    }
    const before = path.at(-2);
    if (
      before !== undefined &&
      previous !== undefined &&
      ((before.xU === previous.xU && previous.xU === point.xU) ||
        (before.yU === previous.yU && previous.yU === point.yU))
    ) {
      path.pop();
    }
    path.push(point);
  }
  return path;
}
