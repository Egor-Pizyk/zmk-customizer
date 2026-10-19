import type { Combo } from '@domain';

export function getComboNodeName(combo: Combo): string {
  const name = combo.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]+/gu, '_')
    .replaceAll(/^_+|_+$/gu, '')
    .slice(0, 12);
  return `user_combo_${name}_${combo.id}`;
}
