import { describe, expect, it } from 'vitest';
import { snapToGrid } from './snap';

describe('snapToGrid', () => {
  it.each([
    [0.37, 0.25, 0.25],
    [0.38, 0.25, 0.5],
    [0.3, 0.1, 0.3],
    [-0.13, 0.25, -0.25],
  ])('snaps %d to grid %d as %d', (valueU, gridU, expected) => {
    expect(snapToGrid(valueU, gridU)).toBe(expected);
  });

  it('always returns an integer multiple of the grid', () => {
    const gridU = 0.05;
    for (let index = 0; index < 1000; index += 1) {
      const steps = snapToGrid(index * 0.0173 - 7, gridU) / gridU;
      expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-9);
    }
  });
});
