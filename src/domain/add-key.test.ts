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

it('refuses an addition at the configured key count without changing identity', () => {
  const project = addKey(buildProject({}), { position: { xU: 0, yU: 0 } });
  expect(addKey(project, { position: { xU: 2, yU: 0 }, maxKeyCount: 1 })).toBe(project);
});
