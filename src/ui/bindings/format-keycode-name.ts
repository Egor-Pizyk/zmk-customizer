import { KEYCODES, keycodeByName } from '../../catalog/keycodes';
import type { Keycode } from '../../catalog/parse-keys-header';

const DESCRIPTION_PREFIX_PATTERN = /^(?:Keyboard|Consumer) /u;

/** Readable name of a keycode for accessible names, the table and status text (spec 004 FR-007). */
export function formatKeycodeName(keycodeName: string): string {
  const keycode = keycodeByName.get(keycodeName);
  if (keycode === undefined) {
    return `Unknown key ${keycodeName}`;
  }
  return DISPLAY_NAMES.get(keycode.name) ?? baseKeycodeName(keycode);
}

function baseKeycodeName(keycode: Keycode): string {
  if (keycode.category === 'letters') {
    return keycode.name;
  }
  const name = keycode.description.replace(DESCRIPTION_PREFIX_PATTERN, '');
  return keycode.category === 'numbers' ? name.charAt(0) : name;
}

// Same readable name on different codes (Stop on K_STOP and K_STOP2) gains its canonical id,
// so every name is unique without inventing sequence numbers (FR-007).
const DISPLAY_NAMES: ReadonlyMap<string, string> = qualifyKeycodeNames(KEYCODES);

function qualifyKeycodeNames(keycodes: readonly Keycode[]): ReadonlyMap<string, string> {
  const counts = new Map<string, number>();
  for (const keycode of keycodes) {
    const base = baseKeycodeName(keycode);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  const display = new Map<string, string>();
  for (const keycode of keycodes) {
    const base = baseKeycodeName(keycode);
    display.set(keycode.name, (counts.get(base) ?? 0) > 1 ? `${base} (${keycode.name})` : base);
  }
  return display;
}
