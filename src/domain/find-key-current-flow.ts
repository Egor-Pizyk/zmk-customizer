import type { Key, KeyPin } from './types';

// Anode → cathode through the closed switch; row/column names are assigned later (docs/zmk/kscan.md).
export function findKeyCurrentFlow(
  key: Key | undefined,
): { readonly fromPin: KeyPin; readonly toPin: KeyPin } | undefined {
  if (key?.diode === undefined) {
    return undefined;
  }
  const { pin, cathode } = key.diode;
  const otherPin = pin === 1 ? 2 : 1;
  return cathode === 'away-switch'
    ? { fromPin: otherPin, toPin: pin }
    : { fromPin: pin, toPin: otherPin };
}
