// ZMK shield ids match [a-z_][a-z0-9_]* (docs/zmk/shield-files.md); non-Latin letters are dropped.
export function toShieldName(name: string): string {
  const shieldName = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '_')
    .replaceAll(/^_+|_+$/gu, '');
  return /^[0-9]/u.test(shieldName) ? `_${shieldName}` : shieldName;
}
