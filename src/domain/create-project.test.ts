import { expect, it } from 'vitest';
import { createProject } from './create-project';

it('creates an empty project named My keyboard without a technical name override', () => {
  const project = createProject({ controllerId: 'nice_nano_v2' });
  expect(project).toEqual({
    schemaVersion: 5,
    controllerId: 'nice_nano_v2',
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
  expect('shieldName' in project).toBe(false);
});

it('takes the controller default from its caller', () => {
  expect(createProject({ controllerId: 'seeeduino_xiao' }).controllerId).toBe('seeeduino_xiao');
});
