import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { getKeyCorners, getKeyCenter } from '@domain';

it('rotates a sized rectangle clockwise around an absolute point', () => {
  const key = {
    id: 'k0',
    xU: 1,
    yU: 2,
    widthU: 2,
    heightU: 1,
    rotationDeg: 90,
    rotationOriginXU: 1,
    rotationOriginYU: 2,
  };
  const expected = [
    { xU: 1, yU: 2 },
    { xU: 1, yU: 4 },
    { xU: 0, yU: 4 },
    { xU: 0, yU: 2 },
  ];
  getKeyCorners(key).map((point, index) => {
    expect(point.xU).toBeCloseTo(getDefinedValue(expected[index]).xU);
    expect(point.yU).toBeCloseTo(getDefinedValue(expected[index]).yU);
    return point;
  });
  expect(getKeyCenter(key).xU).toBeCloseTo(0.5);
  expect(getKeyCenter(key).yU).toBeCloseTo(3);
});
