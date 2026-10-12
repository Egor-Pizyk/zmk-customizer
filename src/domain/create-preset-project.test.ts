import { expect, it } from 'vitest';
import { buildUnibodyProject } from '../../tests/helpers/build-unibody-project';
import { createPresetProject } from './create-preset-project';

it('creates fresh project objects without sharing nested preset data', () => {
  const preset = buildUnibodyProject();
  const project = createPresetProject(preset);
  expect(project).toEqual(preset);
  expect(project).not.toBe(preset);
  expect(project.keys[0]).not.toBe(preset.keys[0]);
  expect(project.wires[0]).not.toBe(preset.wires[0]);
  expect(project.layers[0]?.bindings).not.toBe(preset.layers[0]?.bindings);
});
