import { expect, it } from 'vitest';
import { findFreeKeyPosition } from './find-free-key-position';
import { buildProject } from '../../tests/helpers/build-project';

it('starts at the origin', () => {
  expect(findFreeKeyPosition(buildProject({}))).toEqual({ xU: 0, yU: 0 });
});

it('goes right of the last key, skipping occupied cells', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 3, yU: 0 },
      { id: 'k2', xU: 1, yU: 2 },
    ],
  });
  expect(findFreeKeyPosition(project)).toEqual({ xU: 2, yU: 2 });
  const blocked = buildProject({
    keys: [...project.keys, { id: 'k3', xU: 2, yU: 2 }, { id: 'k4', xU: 1, yU: 2.5 }],
  });
  expect(findFreeKeyPosition(blocked)).toEqual({ xU: 3, yU: 2.5 });
});
