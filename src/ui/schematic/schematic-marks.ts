import type { WireEndSide } from '../../domain/types';
import type { WorkspaceIssue } from '../shell/workspace-issue';

export type SchematicMarks = {
  /** Problem messages per key index (overlap, short), appended to the key's name. */
  readonly problemsByKeyIndex: ReadonlyMap<number, readonly string[]>;
  /** `wireIndex:side` of free ends with a problem (no board pin, conflict, short). */
  readonly problemEnds: ReadonlySet<string>;
  /** `keyIndex:pin` of unconnected pins. */
  readonly unconnectedPins: ReadonlySet<string>;
};

export function toEndMark(input: {
  readonly wireIndex: number;
  readonly side: WireEndSide;
}): string {
  return `${input.wireIndex}:${input.side}`;
}

// Reads issue paths (observability.md) so the canvas marks exactly what the problems panel lists.
export function getSchematicMarks(issues: readonly WorkspaceIssue[]): SchematicMarks {
  const problemsByKeyIndex = new Map<number, string[]>();
  const problemEnds = new Set<string>();
  const unconnectedPins = new Set<string>();
  for (const issue of issues) {
    const [collection, index, part, pin] = issue.path;
    if (collection === 'keys' && typeof index === 'number' && part === undefined) {
      problemsByKeyIndex.set(index, [...(problemsByKeyIndex.get(index) ?? []), issue.message]);
    }
    if (
      issue.code === 'key-pin-unconnected' &&
      collection === 'keys' &&
      typeof index === 'number' &&
      part === 'pins'
    ) {
      unconnectedPins.add(`${index}:${String(pin)}`);
    }
    if (
      collection === 'wires' &&
      typeof index === 'number' &&
      (part === 'start' || part === 'end')
    ) {
      problemEnds.add(toEndMark({ wireIndex: index, side: part }));
    }
  }
  return { problemsByKeyIndex, problemEnds, unconnectedPins };
}
