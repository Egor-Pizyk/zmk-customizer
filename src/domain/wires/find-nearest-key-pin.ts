import { getKeyPinPosition } from '@domain/wires/geometry';
import type { Key, KeyPin, WirePoint } from '@domain';

// MX pins are only ~0.36u apart, so pointer hit areas overlap; the pin is decided by distance,
// not by which hit circle is drawn on top.
export function findNearestKeyPin(key: Key, point: WirePoint): KeyPin {
  const first = getKeyPinPosition(key, 1);
  const second = getKeyPinPosition(key, 2);
  const firstDistance = Math.hypot(first.xU - point.xU, first.yU - point.yU);
  const secondDistance = Math.hypot(second.xU - point.xU, second.yU - point.yU);
  return firstDistance <= secondDistance ? 1 : 2;
}
