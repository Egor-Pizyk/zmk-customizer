import { expect, it } from 'vitest';
import type { Key } from '../../domain/types';
import { findNearestKey } from './find-nearest-key';

const KEYS: readonly Key[] = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
  { id: 'k3', xU: 5, yU: 0.25 },
  { id: 'k4', xU: 1, yU: 1 },
];

it('finds the nearest key in the pressed direction', () => {
  expect(findNearestKey(KEYS, { fromKeyId: 'k1', direction: 'right' })?.id).toBe('k2');
  expect(findNearestKey(KEYS, { fromKeyId: 'k2', direction: 'down' })?.id).toBe('k4');
  expect(findNearestKey(KEYS, { fromKeyId: 'k4', direction: 'up' })?.id).toBe('k2');
});

it('returns nothing when no key lies that way', () => {
  expect(findNearestKey(KEYS, { fromKeyId: 'k1', direction: 'left' })).toBeUndefined();
});
