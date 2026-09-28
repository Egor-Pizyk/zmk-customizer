// Deterministic ids (no Math.random, AGENTS §7.7): the highest existing number plus one (003 R8).
export function createEntityId(input: {
  readonly prefix: 'k' | 'w';
  readonly existingIds: readonly string[];
}): string {
  let highest = 0;
  for (const id of input.existingIds) {
    const number = Number(id.slice(input.prefix.length));
    if (id.startsWith(input.prefix) && Number.isInteger(number)) {
      highest = Math.max(highest, number);
    }
  }
  return `${input.prefix}${highest + 1}`;
}
