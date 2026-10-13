import { expect, it } from 'vitest';
import { isKeyCellInMarquee, isPointInMarquee } from '@ui/canvas';

it('selects a key cell on overlap, not only on top-left inside', () => {
  const marquee = { start: { xU: 0.5, yU: 0.5 }, end: { xU: 2.2, yU: 0.8 } };
  expect(isKeyCellInMarquee({ xU: 0, yU: 0 }, marquee)).toBe(true);
  expect(isKeyCellInMarquee({ xU: 2, yU: 0 }, marquee)).toBe(true);
  expect(isKeyCellInMarquee({ xU: 0, yU: 2 }, marquee)).toBe(false);
});

it('keeps point selection strict for wires and bends', () => {
  const marquee = { start: { xU: 0, yU: 0 }, end: { xU: 1, yU: 1 } };
  expect(isPointInMarquee({ xU: 0.5, yU: 0.5 }, marquee)).toBe(true);
  expect(isPointInMarquee({ xU: 1.5, yU: 0.5 }, marquee)).toBe(false);
});

it('selects the actual rotated rectangle instead of its unrotated cell', () => {
  const key = { id: 'k0', xU: 0, yU: 0, widthU: 2, rotationDeg: 90 };
  expect(
    isKeyCellInMarquee(key, { start: { xU: -0.9, yU: 1.5 }, end: { xU: -0.5, yU: 1.8 } }),
  ).toBe(true);
  expect(isKeyCellInMarquee(key, { start: { xU: 0.2, yU: 0.1 }, end: { xU: 0.8, yU: 0.7 } })).toBe(
    false,
  );
});
