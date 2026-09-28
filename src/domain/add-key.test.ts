import { expect, it } from 'vitest';
import { addKey } from './add-key';
import { buildProject } from '../../tests/helpers/build-project';

it('appends a key with the next id', () => {
  const project = addKey(buildProject({ keys: [{ id: 'k4', xU: 0, yU: 0 }] }), {
    position: { xU: 2, yU: 1 },
  });
  expect(project.keys).toEqual([
    { id: 'k4', xU: 0, yU: 0 },
    { id: 'k5', xU: 2, yU: 1 },
  ]);
});
