import { getKeyPinPosition } from '@domain/wires/geometry';
import { expect, it } from 'vitest';

// MX footprint from the switch center: pin 1 (-3.81, -2.54) mm, pin 2 (+2.54, -5.08) mm; 1u = 19.05 mm.
it('places the pins of a key at (2, 1) like an MX switch', () => {
  const key = { id: 'k1', xU: 2, yU: 1 };
  expect(getKeyPinPosition(key, 1)).toEqual({ xU: 2.3, yU: 1.3667 });
  expect(getKeyPinPosition(key, 2)).toEqual({ xU: 2.6333, yU: 1.2333 });
});

it('centers the fixed MX footprint in a resized cap then rotates pins with it', () => {
  const key = {
    id: 'k0',
    xU: 0,
    yU: 0,
    widthU: 2,
    heightU: 1,
    rotationDeg: 90,
    rotationOriginXU: 1,
    rotationOriginYU: 0.5,
  };
  expect(getKeyPinPosition(key, 1)).toEqual({ xU: 1.1333, yU: 0.3 });
  expect(getKeyPinPosition(key, 2)).toEqual({ xU: 1.2667, yU: 0.6333 });
});
