import { getKeyGeometry, rotatePoint, roundU } from '@domain/geometry';
import type { Key, KeyPin, WirePoint } from '@domain';

const KEY_PITCH_MM = 19.05;

// Cherry MX footprint seen from above, relative to the switch center (003 research R2).
const PIN_OFFSET_MM_BY_PIN: Record<KeyPin, { readonly xMm: number; readonly yMm: number }> = {
  1: { xMm: -3.81, yMm: -2.54 },
  2: { xMm: 2.54, yMm: -5.08 },
};

export function getKeyPinPosition(key: Key, pin: KeyPin): WirePoint {
  const offset = PIN_OFFSET_MM_BY_PIN[pin];
  const geometry = getKeyGeometry(key);
  const at = rotatePoint(
    {
      xU: key.xU + geometry.widthU / 2 + offset.xMm / KEY_PITCH_MM,
      yU: key.yU + geometry.heightU / 2 + offset.yMm / KEY_PITCH_MM,
    },
    {
      rotationDeg: geometry.rotationDeg,
      origin: { xU: geometry.rotationOriginXU, yU: geometry.rotationOriginYU },
    },
  );
  return { xU: roundU(at.xU), yU: roundU(at.yU) };
}
