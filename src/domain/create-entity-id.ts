// Only the allocator interprets decimal suffixes; bigint never enters the serialized Project.
export function createEntityId(input: {
  readonly prefix: 'k' | 'w' | 'l';
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
  return `${input.prefix}${highest + 1n}`;
}
