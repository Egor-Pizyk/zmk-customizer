import type { WirePoint } from '@domain';
import type { RelationPath } from './electrical-relation-types';
import { arcAt } from './relation-path-geometry';

export type RelationOverlap = {
  readonly fromAt: WirePoint;
  readonly toAt: WirePoint;
  readonly first: RelationPath;
  readonly second: RelationPath;
  readonly fromFirst: number;
  readonly toFirst: number;
  readonly fromSecond: number;
  readonly toSecond: number;
};
type Span = { readonly from: WirePoint; readonly to: WirePoint };

export function getSharedSpans({
  first,
  second,
}: {
  readonly first: RelationPath;
  readonly second: RelationPath;
}): RelationOverlap[] {
  const spans: RelationOverlap[] = [];
  for (const [index, from] of first.points.entries()) {
    const to = first.points[index + 1];
    if (to === undefined) {
      break;
    }
    for (const [otherIndex, otherFrom] of second.points.entries()) {
      const otherTo = second.points[otherIndex + 1];
      if (otherTo === undefined) {
        break;
      }
      const shared = sharedSpan({ first: { from, to }, second: { from: otherFrom, to: otherTo } });
      if (shared !== undefined) {
        spans.push({
          first,
          second,
          fromAt: shared.from,
          toAt: shared.to,
          fromFirst: arcAt(first.points, shared.from) ?? 0,
          toFirst: arcAt(first.points, shared.to) ?? 0,
          fromSecond: arcAt(second.points, shared.from) ?? 0,
          toSecond: arcAt(second.points, shared.to) ?? 0,
        });
      }
    }
  }
  return spans;
}

function sharedSpan({
  first,
  second,
}: {
  readonly first: Span;
  readonly second: Span;
}): Span | undefined {
  const horizontal = first.from.yU === first.to.yU;
  if (horizontal !== (second.from.yU === second.to.yU)) {
    return undefined;
  }
  const fixed = horizontal ? 'yU' : 'xU';
  const variable = horizontal ? 'xU' : 'yU';
  if (first.from[fixed] !== second.from[fixed]) {
    return undefined;
  }
  const min = Math.max(
    Math.min(first.from[variable], first.to[variable]),
    Math.min(second.from[variable], second.to[variable]),
  );
  const max = Math.min(
    Math.max(first.from[variable], first.to[variable]),
    Math.max(second.from[variable], second.to[variable]),
  );
  if (max - min <= 1e-7) {
    return undefined;
  }
  const from = first.from[variable] < first.to[variable] ? min : max;
  const to = first.from[variable] < first.to[variable] ? max : min;
  return horizontal
    ? { from: { xU: from, yU: first.from.yU }, to: { xU: to, yU: first.from.yU } }
    : { from: { xU: first.from.xU, yU: from }, to: { xU: first.from.xU, yU: to } };
}
