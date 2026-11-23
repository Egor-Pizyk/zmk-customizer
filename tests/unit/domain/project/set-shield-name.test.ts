import { setShieldName } from '@domain/project';
import type { Project } from '@domain';
import { expect, it } from 'vitest';

const PROJECT: Project = {
  schemaVersion: 14,
  encoders: [],
  combos: [],
  macros: [],
  conditionalLayers: [],
  behaviors: [],
  firmware: {},
  controllerId: 'nice_nano_v2',
  keys: [],
  wires: [],
  insulatedCrossings: [],
  layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  name: 'Corne',
};

it('stores the override exactly as typed', () => {
  expect(setShieldName(PROJECT, { shieldName: '2Bad' })).toEqual({
    ...PROJECT,
    shieldName: '2Bad',
  });
});

it('removes the key when the override is cleared', () => {
  const cleared = setShieldName({ ...PROJECT, shieldName: 'corne' }, { shieldName: undefined });
  expect(cleared).toEqual(PROJECT);
  expect('shieldName' in cleared).toBe(false);
});

it('returns the same reference when unchanged', () => {
  const project = { ...PROJECT, shieldName: 'corne' };
  expect(setShieldName(project, { shieldName: 'corne' })).toBe(project);
  expect(setShieldName(PROJECT, { shieldName: undefined })).toBe(PROJECT);
});

it('does not mutate the input', () => {
  const project = { ...PROJECT, shieldName: 'corne' };
  setShieldName(project, { shieldName: undefined });
  expect(project.shieldName).toBe('corne');
});
