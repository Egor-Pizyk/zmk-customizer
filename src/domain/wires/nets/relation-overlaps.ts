import type { WireContacts } from '@domain/wires/contacts';
import type { RelationPath } from './electrical-relation-types';
import { getSharedSpans } from './relation-overlap-spans';
import type { RelationOverlap } from './relation-overlap-spans';
import { compareText } from './relation-path-geometry';

export function addSharedSpans(paths: readonly RelationPath[], contacts: WireContacts) {
  for (const pair of contacts.overlaps) {
    const ids = pair.toSorted(compareText);
    const first = paths.filter((path) => path.wireId === ids[0]);
    const second = paths.filter((path) => path.wireId === ids[1]);
    const spans = first
      .flatMap((one) => second.flatMap((other) => getSharedSpans({ first: one, second: other })))
      .toSorted(compareSpans);
    const merged = mergeSpans(spans);
    for (const [index, span] of merged.entries()) {
      const label = `overlap:${ids[0]}:${ids[1]}:${index}`;
      span.first.sites.push(
        { arc: span.fromFirst, at: span.fromAt, label: `${label}:start` },
        { arc: span.toFirst, at: span.toAt, label: `${label}:end` },
      );
      span.second.sites.push(
        { arc: span.fromSecond, at: span.fromAt, label: `${label}:start` },
        { arc: span.toSecond, at: span.toAt, label: `${label}:end` },
      );
    }
  }
}

function mergeSpans(spans: readonly RelationOverlap[]): readonly RelationOverlap[] {
  const merged: RelationOverlap[] = [];
  for (const span of spans) {
    const previous = merged.at(-1);
    if (
      previous !== undefined &&
      previous.first === span.first &&
      previous.second === span.second &&
      Math.abs(previous.toFirst - span.fromFirst) < 1e-7 &&
      Math.abs(previous.toSecond - span.fromSecond) < 1e-7
    ) {
      merged[merged.length - 1] = {
        ...previous,
        toFirst: span.toFirst,
        toSecond: span.toSecond,
        toAt: span.toAt,
      };
    } else {
      merged.push(span);
    }
  }
  return merged;
}

function compareSpans(first: RelationOverlap, second: RelationOverlap): number {
  return (
    first.first.order - second.first.order ||
    first.second.order - second.second.order ||
    first.fromFirst - second.fromFirst ||
    first.toFirst - second.toFirst ||
    first.fromSecond - second.fromSecond
  );
}
