import type { Binding } from '../types';

// Bindings are plain JSON; comparing with sorted keys ignores property order. Key order uses
// code-unit comparison so the result never depends on the runtime locale (deterministic output).
function compareKeys(first: string, second: string): number {
  if (first < second) {
    return -1;
  }
  return first > second ? 1 : 0;
}

function toSortedJson(binding: Binding): string {
  return JSON.stringify(binding, (_key, value: unknown) =>
    value instanceof Object && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).toSorted(([first], [second]) => compareKeys(first, second)),
        )
      : value,
  );
}

export function isSameBinding(first: Binding | undefined, second: Binding | undefined): boolean {
  if (first === undefined || second === undefined) {
    return first === second;
  }
  return toSortedJson(first) === toSortedJson(second);
}
