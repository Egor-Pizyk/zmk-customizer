import { parseKeysHeader } from './parse-keys-header';
import type { Keycode } from './parse-keys-header';
import keysHeader from './zmk/keys.h?raw';

// Parsed at load from the verbatim v0.3 header instead of an `as const` table (spec 004 R2).
export const KEYCODES: readonly Keycode[] = parseKeysHeader(keysHeader);

// Module-private Map exported as ReadonlyMap: the type lock is the protection (a Map cannot be
// frozen). Never call .set/.delete on it outside this module; BINDINGS_CATALOG holds its keys.
export const keycodeByName: ReadonlyMap<string, Keycode> = new Map(
  KEYCODES.flatMap((keycode) =>
    [keycode.name, ...keycode.aliases].map((name) => [name, keycode] as const),
  ),
);

const MODIFIER_KEYCODE_NAMES = [
  'LEFT_CONTROL',
  'LEFT_SHIFT',
  'LEFT_ALT',
  'LEFT_GUI',
  'RIGHT_CONTROL',
  'RIGHT_SHIFT',
  'RIGHT_ALT',
  'RIGHT_GUI',
] as const;

/** Offered first for mod-tap hold and sticky key (spec 004 FR-012). */
export const MODIFIER_KEYCODES: readonly Keycode[] = MODIFIER_KEYCODE_NAMES.flatMap(
  (name) => keycodeByName.get(name) ?? [],
);
