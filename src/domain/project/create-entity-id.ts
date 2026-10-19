import { PROJECT_BUDGET } from './project-budget';

// Only the allocator interprets decimal suffixes; bigint never enters the serialized Project.
export function createEntityId(input: {
  readonly prefix: 'e' | 'k' | 'w' | 'l' | 't' | 'c' | 'm' | 'q' | 's';
  readonly existingIds: readonly string[];
}): string {
  let highest = 0n;
  for (const id of input.existingIds) {
    const suffix = id.slice(input.prefix.length);
    if (id.startsWith(input.prefix) && /^\d+$/u.test(suffix)) {
      const number = BigInt(suffix);
      if (number > highest) {
        highest = number;
      }
    }
  }
  const next = `${input.prefix}${highest + 1n}`;
  if (next.length <= PROJECT_BUDGET.idLength) {
    return next;
  }
  // Imported maximum-length IDs must leave room for future edits. Existing references stay intact.
  const taken = new Set(input.existingIds);
  let suffix = 1n;
  while (taken.has(`${input.prefix}${suffix}`)) {
    suffix += 1n;
  }
  return `${input.prefix}${suffix}`;
}
