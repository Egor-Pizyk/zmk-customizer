import { expect, it } from 'vitest';
import { getKeyPinPosition } from './get-key-pin-position';

// MX footprint from the switch center: pin 1 (-3.81, -2.54) mm, pin 2 (+2.54, -5.08) mm; 1u = 19.05 mm.
it('places the pins of a key at (2, 1) like an MX switch', () => {
  const key = { id: 'k1', xU: 2, yU: 1 };
  expect(getKeyPinPosition(key, 1)).toEqual({ xU: 2.3, yU: 1.3667 });
  expect(getKeyPinPosition(key, 2)).toEqual({ xU: 2.6333, yU: 1.2333 });
});
