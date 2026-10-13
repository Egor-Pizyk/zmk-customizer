import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { findKeyLayoutCenter } from '@domain';

it('centers between extreme key bounds rather than averaging the keys', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: -4, yU: -2 },
      { id: 'k2', xU: -3, yU: -1 },
      { id: 'k3', xU: 10, yU: 6 },
    ],
  });
  expect(findKeyLayoutCenter(project)).toEqual({ xU: 3.5, yU: 2.5 });
});

it('returns the center of a single key and no center for an empty layout', () => {
  expect(findKeyLayoutCenter(buildProject({ keys: [{ id: 'k1', xU: 2, yU: 3 }] }))).toEqual({
    xU: 2.5,
    yU: 3.5,
  });
  expect(findKeyLayoutCenter(buildProject({}))).toBeUndefined();
});

it('calculates large layout bounds without exceeding the argument limit', () => {
  const keys = Array.from({ length: 150_000 }, (_, index) => ({
    id: `k${index}`,
    xU: index,
    yU: 0,
  }));
  expect(findKeyLayoutCenter(buildProject({ keys }))).toEqual({ xU: 75_000, yU: 0.5 });
});

it('centers the visible bounds of a rotated wide key', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 2, heightU: 1, rotationDeg: 90 }],
  });
  const center = findKeyLayoutCenter(project);
  expect(center?.xU).toBeCloseTo(-0.5);
  expect(center?.yU).toBeCloseTo(1);
});
