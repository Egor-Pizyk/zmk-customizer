import type { WirePoint } from '@domain';
import type { RoutingSegment, SymmetricRouteInput, SymmetricRoute } from './symmetric-route-types';
import type { createRouteSegmentIndex } from './route-segment-index';

type Check = {
  readonly blockingIds: readonly string[];
  readonly insulatedCrossings: SymmetricRoute['insulatedCrossings'];
};

export function checkRouteCandidate(
  points: readonly WirePoint[],
  input: SymmetricRouteInput,
  nearby: ReturnType<typeof createRouteSegmentIndex>,
): Check {
  const blocked = new Set<string>();
  const crossings = new Map<string, SymmetricRoute['insulatedCrossings'][number]>();
  for (const [index, from] of points.entries()) {
    const to = points[index + 1];
    if (to === undefined) {
      break;
    }
    for (const id of findBlockingPins({ from, to }, input)) {
      blocked.add(id);
    }
    for (const segment of nearby(from, to, input.clearanceU)) {
      const result = checkSegment({ from, to }, segment, input.clearanceU);
      if (result === 'blocked') {
        blocked.add(segment.id);
        continue;
      }
      if (result === undefined) {
        continue;
      }
      if (isFixedEndpoint(result, points)) {
        blocked.add(segment.id);
        continue;
      }
      crossings.set(`${segment.id}:${result.xU}:${result.yU}`, {
        segmentId: segment.id,
        at: result,
      });
    }
  }
  return {
    blockingIds: [...blocked].toSorted(),
    insulatedCrossings: [...crossings.values()].toSorted(compareCrossings),
  };
}

function checkSegment(
  { from, to }: { readonly from: WirePoint; readonly to: WirePoint },
  obstacle: RoutingSegment,
  clearance: number,
): WirePoint | 'blocked' | undefined {
  const horizontal = from.yU === to.yU;
  const otherHorizontal = obstacle.from.yU === obstacle.to.yU;
  if (horizontal === otherHorizontal) {
    const fixed = horizontal ? 'yU' : 'xU';
    const variable = horizontal ? 'xU' : 'yU';
    const gap = Math.max(
      0,
      Math.max(
        Math.min(from[variable], to[variable]),
        Math.min(obstacle.from[variable], obstacle.to[variable]),
      ) -
        Math.min(
          Math.max(from[variable], to[variable]),
          Math.max(obstacle.from[variable], obstacle.to[variable]),
        ),
    );
    return Math.hypot(from[fixed] - obstacle.from[fixed], gap) < clearance - 0.00000001
      ? 'blocked'
      : undefined;
  }
  const at = horizontal
    ? { xU: obstacle.from.xU, yU: from.yU }
    : { xU: from.xU, yU: obstacle.from.yU };
  if (!onSegment(at, { from, to }) || !onSegment(at, obstacle)) {
    return undefined;
  }
  return samePoint({ first: at, second: obstacle.from }) ||
    samePoint({ first: at, second: obstacle.to })
    ? 'blocked'
    : at;
}

function onSegment(
  point: WirePoint,
  { from, to }: { readonly from: WirePoint; readonly to: WirePoint },
): boolean {
  return (
    point.xU >= Math.min(from.xU, to.xU) &&
    point.xU <= Math.max(from.xU, to.xU) &&
    point.yU >= Math.min(from.yU, to.yU) &&
    point.yU <= Math.max(from.yU, to.yU)
  );
}

function samePoint({
  first,
  second,
}: {
  readonly first: WirePoint;
  readonly second: WirePoint | undefined;
}): boolean {
  return first.xU === second?.xU && first.yU === second.yU;
}

function compareIds({
  first,
  second,
}: {
  readonly first: string;
  readonly second: string;
}): number {
  return first < second ? -1 : Number(first > second);
}

function compareCrossings(
  first: SymmetricRoute['insulatedCrossings'][number],
  second: SymmetricRoute['insulatedCrossings'][number],
): number {
  return (
    compareIds({ first: first.segmentId, second: second.segmentId }) ||
    first.at.xU - second.at.xU ||
    first.at.yU - second.at.yU
  );
}

function findBlockingPins(
  span: { readonly from: WirePoint; readonly to: WirePoint },
  input: SymmetricRouteInput,
): readonly string[] {
  return (input.forbiddenPoints ?? []).flatMap((pin, index) =>
    onSegment(pin, span) || pointDistance(span, pin) < (input.pinClearanceU ?? 0) - 1e-8
      ? [`pin:${index}`]
      : [],
  );
}
function pointDistance(
  span: { readonly from: WirePoint; readonly to: WirePoint },
  pin: WirePoint,
): number {
  const x = Math.max(
    Math.min(span.from.xU, span.to.xU) - pin.xU,
    0,
    pin.xU - Math.max(span.from.xU, span.to.xU),
  );
  const y = Math.max(
    Math.min(span.from.yU, span.to.yU) - pin.yU,
    0,
    pin.yU - Math.max(span.from.yU, span.to.yU),
  );
  return Math.hypot(x, y);
}

function isFixedEndpoint(point: WirePoint, points: readonly WirePoint[]): boolean {
  return (
    samePoint({ first: point, second: points[0] }) ||
    samePoint({ first: point, second: points.at(-1) })
  );
}
