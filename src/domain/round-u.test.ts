import { expect, it } from 'vitest';
import { roundU } from './round-u';

it('drops float noise and negative zero', () => {
  expect(roundU(0.1 + 0.2)).toBe(0.3);
  expect(roundU(0.5 - 3.81 / 19.05)).toBe(0.3);
  expect(Object.is(roundU(-0.00001), 0)).toBe(true);
});
