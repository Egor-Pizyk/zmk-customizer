import { roundU } from './round-u';
import type { Key, KeyPin, WirePoint } from './types';

const KEY_PITCH_MM = 19.05;

// Cherry MX footprint seen from above, relative to the switch center (003 research R2).
const PIN_OFFSET_MM_BY_PIN: Record<KeyPin, { readonly xMm: number; readonly yMm: number }> = {
  1: { xMm: -3.81, yMm: -2.54 },
  2: { xMm: 2.54, yMm: -5.08 },
};

export function getKeyPinPosition(key: Key, pin: KeyPin): WirePoint {
  const offset = PIN_OFFSET_MM_BY_PIN[pin];
  return {
    xU: roundU(key.xU + 0.5 + offset.xMm / KEY_PITCH_MM),
    yU: roundU(key.yU + 0.5 + offset.yMm / KEY_PITCH_MM),
  };
}
