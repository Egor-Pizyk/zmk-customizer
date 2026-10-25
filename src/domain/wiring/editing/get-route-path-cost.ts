import type { WirePoint } from '@domain';

export type RoutePin = { readonly id: string; readonly at: WirePoint };
export type RouteSegment = {
  readonly start: WirePoint;
  readonly end: WirePoint;
  readonly net: string;
};
export type RouteArea = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};
export type RouteContext = {
  readonly pins: readonly RoutePin[];
  readonly areas: readonly RouteArea[];
  readonly segments: readonly RouteSegment[];
  readonly net: string;
  readonly allowedPins: readonly string[];
};

export function getRoutePathCost(path: readonly WirePoint[], context: RouteContext): number {
  let cost = Math.max(0, path.length - 2) * 0.05;
  const forbidden = context.pins.filter((pin) => !context.allowedPins.includes(pin.id));
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    if (start === undefined || end === undefined) {
      return Infinity;
    }
    if (forbidden.some((pin) => isPointOnSegment(pin.at, start, end))) {
      return Infinity;
    }
    if (context.areas.some((area) => doesSegmentCrossArea(start, end, area))) {
      return Infinity;
    }
    cost += Math.abs(end.xU - start.xU) + Math.abs(end.yU - start.yU);
    const penalty = getSegmentPenalty({ start, end, net: context.net }, context.segments);
    if (!Number.isFinite(penalty)) {
      return Infinity;
    }
    cost += penalty;
  }
  return cost;
}

function isPointOnSegment(point: WirePoint, start: WirePoint, end: WirePoint) {
  return (
    Math.abs(
      (point.xU - start.xU) * (end.yU - start.yU) - (point.yU - start.yU) * (end.xU - start.xU),
    ) < 0.000001 &&
    point.xU >= Math.min(start.xU, end.xU) - 0.000001 &&
    point.xU <= Math.max(start.xU, end.xU) + 0.000001 &&
    point.yU >= Math.min(start.yU, end.yU) - 0.000001 &&
    point.yU <= Math.max(start.yU, end.yU) + 0.000001
  );
}

function getSegmentPenalty(segment: RouteSegment, obstacles: readonly RouteSegment[]) {
  let penalty = 0;
  for (const other of obstacles) {
    if (other.net === segment.net) {
      continue;
    }
    if (
      isPointOnSegment(other.start, segment.start, segment.end) ||
      isPointOnSegment(other.end, segment.start, segment.end) ||
      isPointOnSegment(segment.start, other.start, other.end) ||
      isPointOnSegment(segment.end, other.start, other.end)
    ) {
      return Infinity;
    }
    const horizontal = segment.start.yU === segment.end.yU;
    const otherHorizontal = other.start.yU === other.end.yU;
    if (horizontal === otherHorizontal) {
      continue;
    }
    const crossing = horizontal
      ? { xU: other.start.xU, yU: segment.start.yU }
      : { xU: segment.start.xU, yU: other.start.yU };
    if (
      isPointOnSegment(crossing, segment.start, segment.end) &&
      isPointOnSegment(crossing, other.start, other.end)
    ) {
      penalty += 0.1;
    }
  }
  return penalty;
}

function doesSegmentCrossArea(start: WirePoint, end: WirePoint, area: RouteArea) {
  return (
    Math.max(start.xU, end.xU) >= area.minX &&
    Math.min(start.xU, end.xU) <= area.maxX &&
    Math.max(start.yU, end.yU) >= area.minY &&
    Math.min(start.yU, end.yU) <= area.maxY
  );
}
