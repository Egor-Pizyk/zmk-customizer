import type { Modifier } from '@domain';

// v0.3 dt-bindings/zmk/modifiers.h, documented in docs/zmk/keymap.md §4.
export const MODIFIER_BITS = {
  LC: 'MOD_LCTL',
  LS: 'MOD_LSFT',
  LA: 'MOD_LALT',
  LG: 'MOD_LGUI',
  RC: 'MOD_RCTL',
  RS: 'MOD_RSFT',
  RA: 'MOD_RALT',
  RG: 'MOD_RGUI',
} as const satisfies Record<Modifier, string>;
