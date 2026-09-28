// Bends have no identity beyond their order. Positional keys keep an edited bend field mounted
// (keying by coordinates remounted it on every commit and dropped focus).
export function toSlotKeys(input: { readonly prefix: string; readonly count: number }): string[] {
  return Array.from({ length: input.count }, (_unused, slot) => `${input.prefix}-${slot}`);
}
