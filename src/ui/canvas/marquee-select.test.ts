import { expect, it } from 'vitest';
import { isKeyCellInMarquee, isPointInMarquee } from './marquee-select';

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
