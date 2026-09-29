import { expect, it } from 'vitest';
import { createProject } from './create-project';

it('creates an empty project named My keyboard without a technical name override', () => {
  const project = createProject();
  expect(project).toEqual({
    schemaVersion: 3,
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
  expect('shieldName' in project).toBe(false);
});
