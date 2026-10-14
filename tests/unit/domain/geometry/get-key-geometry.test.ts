import { getKeyGeometry } from '@domain/geometry';
import { expect, it } from 'vitest';

it('resolves legacy geometry without altering its saved data', () => {
  const key = Object.freeze({ id: 'k0', xU: 2, yU: -1 });
  expect(getKeyGeometry(key)).toEqual({
    xU: 2,
    yU: -1,
    widthU: 1,
    heightU: 1,
    rotationDeg: 0,
    rotationOriginXU: 0,
    rotationOriginYU: 0,
  });
  expect(key).toEqual({ id: 'k0', xU: 2, yU: -1 });
});
it('retains explicitly supplied dimensions and absolute origins', () => {
  expect(
    getKeyGeometry({
      id: 'k0',
      xU: 0,
      yU: 0,
      widthU: 2.25,
      heightU: 1.5,
      rotationDeg: -15,
      rotationOriginXU: 3,
      rotationOriginYU: 2,
    }),
  ).toMatchObject({
    widthU: 2.25,
    heightU: 1.5,
    rotationDeg: -15,
    rotationOriginXU: 3,
    rotationOriginYU: 2,
  });
});
