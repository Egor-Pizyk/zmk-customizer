import { expect, it } from 'vitest';
import { getNearestPointOnPath } from '@domain';

const PATH = [
  { xU: 0, yU: 0 },
  { xU: 4, yU: 0 },
  { xU: 4, yU: 3 },
];

it('clamps to the closest orthogonal segment', () => {
  expect(getNearestPointOnPath(PATH, { xU: 2, yU: 0.4 })).toEqual({ xU: 2, yU: 0 });
  expect(getNearestPointOnPath(PATH, { xU: 5, yU: 2 })).toEqual({ xU: 4, yU: 2 });
  expect(getNearestPointOnPath(PATH, { xU: -1, yU: -1 })).toEqual({ xU: 0, yU: 0 });
});

it('has no point on an empty path', () => {
  expect(getNearestPointOnPath([], { xU: 0, yU: 0 })).toBeUndefined();
});
