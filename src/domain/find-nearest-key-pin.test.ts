import { expect, it } from 'vitest';
import { findNearestKeyPin } from './find-nearest-key-pin';

const KEY = { id: 'k1', xU: 0, yU: 0 };

// Pin 1 (lower left) at (0.3, 0.3667), pin 2 (upper right) at (0.6333, 0.2333).
it('picks the pin closest to the point', () => {
  expect(findNearestKeyPin(KEY, { xU: 0.3, yU: 0.3667 })).toBe(1);
  expect(findNearestKeyPin(KEY, { xU: 0.42, yU: 0.33 })).toBe(1);
  expect(findNearestKeyPin(KEY, { xU: 0.6333, yU: 0.2333 })).toBe(2);
  expect(findNearestKeyPin(KEY, { xU: 0.52, yU: 0.27 })).toBe(2);
});
