import { expect, it } from 'vitest';
import { isSameCrossing } from './is-same-crossing';

it('compares both wire ids and the ordinal', () => {
  const ref = { wireIds: ['w1', 'w2'] as const, ordinal: 0 };
  expect(isSameCrossing(ref, { wireIds: ['w1', 'w2'], ordinal: 0 })).toBe(true);
  expect(isSameCrossing(ref, { wireIds: ['w1', 'w2'], ordinal: 1 })).toBe(false);
  expect(isSameCrossing(ref, { wireIds: ['w1', 'w3'], ordinal: 0 })).toBe(false);
});
