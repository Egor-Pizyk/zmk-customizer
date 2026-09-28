import { expect, it } from 'vitest';
import { createProject } from './create-project';

it('creates an empty project named My keyboard without a technical name override', () => {
  const project = createProject();
  expect(project).toEqual({
    schemaVersion: 2,
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
  });
  expect('shieldName' in project).toBe(false);
});
