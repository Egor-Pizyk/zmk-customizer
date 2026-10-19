import type { KeyStroke } from '@domain';

export function formatStrokeCode(stroke: KeyStroke): string {
  const opening = stroke.modifiers.map((modifier) => `${modifier}(`).join('');
  return `${opening}${stroke.keycode}${')'.repeat(stroke.modifiers.length)}`;
}
