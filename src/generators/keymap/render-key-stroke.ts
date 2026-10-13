import type { KeyStroke } from '@domain';

export function renderKeyStroke(keyStroke: KeyStroke): string {
  let keycode = keyStroke.keycode;
  for (const modifier of keyStroke.modifiers.toReversed()) {
    keycode = `${modifier}(${keycode})`;
  }
  return keycode;
}
