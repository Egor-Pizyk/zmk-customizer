import { expect, it } from 'vitest';
import { findKeysInMarquee } from '@ui/bindings';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
  { id: 'k3', xU: 0, yU: 2 },
];

it('selects keys whose 1u cell intersects the marquee, in either drag direction', () => {
  expect(
    findKeysInMarquee(KEYS, { start: { xU: 0.5, yU: 0.5 }, end: { xU: 2.2, yU: 0.8 } }),
  ).toEqual(['k1', 'k2']);
  expect(
    findKeysInMarquee(KEYS, { start: { xU: 0.9, yU: 2.9 }, end: { xU: 0.1, yU: 1.5 } }),
  ).toEqual(['k3']);
});

it('selects nothing in empty space', () => {
  expect(
    findKeysInMarquee(KEYS, { start: { xU: 1.1, yU: 1.1 }, end: { xU: 1.9, yU: 1.9 } }),
  ).toEqual([]);
});
