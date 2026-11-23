import type { WirePoint } from '@domain';
import type { RoutingSegment } from './symmetric-route-types';

type Entry = {
  readonly segment: RoutingSegment;
  readonly at: number;
  readonly min: number;
  readonly max: number;
};

/** Local immutable sorted-axis index; queries inspect only obstacles in the expanded span bounds. */
export function createRouteSegmentIndex(segments: readonly RoutingSegment[]) {
  const horizontal: Entry[] = [];
  const vertical: Entry[] = [];
  for (const segment of segments) {
    const isHorizontal = segment.from.yU === segment.to.yU;
    const coordinate = isHorizontal ? 'xU' : 'yU';
    const at = isHorizontal ? segment.from.yU : segment.from.xU;
    const entry = {
      segment,
      at,
      min: Math.min(segment.from[coordinate], segment.to[coordinate]),
      max: Math.max(segment.from[coordinate], segment.to[coordinate]),
    };
    (isHorizontal ? horizontal : vertical).push(entry);
  }
  const axes = [horizontal, vertical].map((entries) =>
    entries.toSorted((first, second) => first.at - second.at),
  );
  return (from: WirePoint, to: WirePoint, clearance: number): readonly RoutingSegment[] => {
    const x = {
      min: Math.min(from.xU, to.xU) - clearance,
      max: Math.max(from.xU, to.xU) + clearance,
    };
    const y = {
      min: Math.min(from.yU, to.yU) - clearance,
      max: Math.max(from.yU, to.yU) + clearance,
    };
    return axes.flatMap((entries, index) =>
      findEntries(entries, index === 0 ? y : x, index === 0 ? x : y),
    );
  };
}

function findEntries(
  entries: readonly Entry[],
  fixed: { readonly min: number; readonly max: number },
  variable: { readonly min: number; readonly max: number },
): readonly RoutingSegment[] {
  let lower = 0;
  let upper = entries.length;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if ((entries[middle]?.at ?? Infinity) < fixed.min) {
      lower = middle + 1;
    } else {
      upper = middle;
    }
  }
  const result: RoutingSegment[] = [];
  for (let index = lower; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry === undefined || entry.at > fixed.max) {
      break;
    }
    if (entry.max >= variable.min && entry.min <= variable.max) {
      result.push(entry.segment);
    }
  }
  return result;
}
