import type { Macro } from '@domain';

export function getMacroLabel(macro: Macro): string {
  const name = macro.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]+/gu, '_')
    .replaceAll(/^_+|_+$/gu, '')
    .slice(0, 12);
  return `user_macro_${name}_${macro.id}`;
}
