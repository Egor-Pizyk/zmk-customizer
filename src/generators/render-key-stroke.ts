import type { KeyStroke } from '../domain/types';

export function renderKeyStroke(keyStroke: KeyStroke): string {
  let keycode = keyStroke.keycode;
  for (const modifier of keyStroke.modifiers.toReversed()) {
    keycode = `${modifier}(${keycode})`;
  }
  return keycode;
}
