import { getWirePath } from './get-wire-path';
import type { Project, Wire, WirePoint } from './types';

type Segment = { readonly from: WirePoint; readonly to: WirePoint; readonly isHorizontal: boolean };

type Bounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

type WireShape = {
  readonly wire: Wire;
  readonly path: readonly WirePoint[];
  readonly segments: readonly Segment[];
  readonly bounds: Bounds;
};

export type WireCrossing = {
  readonly wireIds: readonly [string, string];
  readonly ordinal: number;
  readonly at: WirePoint;
};

export type WireContacts = {
  readonly crossings: readonly WireCrossing[];
  /** Pairs of wires that run along each other; they are joined, never insulated (spec edge case). */
  readonly overlaps: readonly (readonly [string, string])[];
};

function isBetween(value: number, first: number, second: number): boolean {
  return value >= Math.min(first, second) && value <= Math.max(first, second);
}

function toShape(project: Project, wire: Wire): WireShape {
  const path = getWirePath(project, wire);
  const segments = path.slice(1).map((to, index) => {
    const from = path[index] ?? to;
    return { from, to, isHorizontal: from.yU === to.yU };
  });
  const xs = path.map((point) => point.xU);
  const ys = path.map((point) => point.yU);
  const bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
  return { wire, path, segments, bounds };
}

function areBoundsApart(first: Bounds, second: Bounds): boolean {
  return (
    first.maxX < second.minX ||
    second.maxX < first.minX ||
    first.maxY < second.minY ||
    second.maxY < first.minY
  );
}

function getOverlapLength(first: Segment, second: Segment): number {
  const axis = first.isHorizontal ? 'xU' : 'yU';
  const cross = first.isHorizontal ? 'yU' : 'xU';
  if (first.from[cross] !== second.from[cross]) {
    return -1;
  }
  const low = Math.max(
    Math.min(first.from[axis], first.to[axis]),
    Math.min(second.from[axis], second.to[axis]),
  );
  const high = Math.min(
    Math.max(first.from[axis], first.to[axis]),
    Math.max(second.from[axis], second.to[axis]),
  );
  return high - low;
}

function findTouchPoint(first: Segment, second: Segment): WirePoint | 'overlap' | undefined {
  if (first.isHorizontal === second.isHorizontal) {
    const length = getOverlapLength(first, second);
    if (length > 0) {
      return 'overlap';
    }
    return length === 0 ? findSharedPoint(first, second) : undefined;
  }
  const horizontal = first.isHorizontal ? first : second;
  const vertical = first.isHorizontal ? second : first;
  const at = { xU: vertical.from.xU, yU: horizontal.from.yU };
  return isBetween(at.xU, horizontal.from.xU, horizontal.to.xU) &&
    isBetween(at.yU, vertical.from.yU, vertical.to.yU)
    ? at
    : undefined;
}

function findSharedPoint(first: Segment, second: Segment): WirePoint | undefined {
  const points = [first.from, first.to];
  return points.find((point) =>
    [second.from, second.to].some((other) => other.xU === point.xU && other.yU === point.yU),
  );
}

function isEndPoint(shape: WireShape, point: WirePoint): boolean {
  const ends = [shape.path[0], shape.path.at(-1)];
  return ends.some((end) => end !== undefined && end.xU === point.xU && end.yU === point.yU);
}

function getArcPosition(path: readonly WirePoint[], point: WirePoint): number {
  let travelled = 0;
  for (const [index, from] of path.entries()) {
    const to = path[index + 1] ?? from;
    if (isBetween(point.xU, from.xU, to.xU) && isBetween(point.yU, from.yU, to.yU)) {
      return travelled + Math.abs(point.xU - from.xU) + Math.abs(point.yU - from.yU);
    }
    travelled += Math.abs(to.xU - from.xU) + Math.abs(to.yU - from.yU);
  }
  return travelled;
}

function collectTouches(first: WireShape, second: WireShape): WirePoint[] | 'overlap' {
  const points = new Map<string, WirePoint>();
  for (const firstSegment of first.segments) {
    for (const secondSegment of second.segments) {
      const touch = findTouchPoint(firstSegment, secondSegment);
      if (touch === 'overlap') {
        return 'overlap';
      }
      if (touch !== undefined) {
        points.set(`${touch.xU},${touch.yU}`, touch);
      }
    }
  }
  return [...points.values()];
}

function findPairCrossings(first: WireShape, second: WireShape): WireCrossing[] | 'overlap' {
  const touches = collectTouches(first, second);
  if (touches === 'overlap') {
    return 'overlap';
  }
  const [lower, higher] = first.wire.id < second.wire.id ? [first, second] : [second, first];
  return (
    touches
      // Only interior points cross. A wire end touching another wire is not a crossing: a join is
      // a junction end, and a pin a wire only passes over stays unconnected (003 review M2).
      .filter((point) => !isEndPoint(first, point) && !isEndPoint(second, point))
      .toSorted((one, other) => getArcPosition(lower.path, one) - getArcPosition(lower.path, other))
      .map((at, ordinal) => ({ wireIds: [lower.wire.id, higher.wire.id], ordinal, at }))
  );
}

// ponytail: O(n²) over wire pairs (bounding boxes skip most); a sweep line is the upgrade if the
// profiler shows lag at 100 keys / 300 wires (003 R12, SC-005).
export function findWireContacts(project: Project): WireContacts {
  const shapes = project.wires.map((wire) => toShape(project, wire));
  const crossings: WireCrossing[] = [];
  const overlaps: (readonly [string, string])[] = [];
  for (const [index, first] of shapes.entries()) {
    for (const second of shapes.slice(index + 1)) {
      if (areBoundsApart(first.bounds, second.bounds)) {
        continue;
      }
      const result = findPairCrossings(first, second);
      if (result === 'overlap') {
        overlaps.push([first.wire.id, second.wire.id]);
      } else {
        crossings.push(...result);
      }
    }
  }
  return { crossings, overlaps };
}
