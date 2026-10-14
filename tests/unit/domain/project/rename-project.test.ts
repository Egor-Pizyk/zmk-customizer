import type { Project } from '@domain';
import { renameProject } from '@domain/project';
import { expect, it } from 'vitest';

const PROJECT: Project = {
  schemaVersion: 7,
  controllerId: 'nice_nano_v2',
  keys: [],
  wires: [],
  insulatedCrossings: [],
  layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  name: 'Old',
  shieldName: 'corne',
};

it('sets the name exactly as typed and keeps the override', () => {
  expect(renameProject(PROJECT, { name: '  New  ' })).toEqual({
    schemaVersion: 7,
    controllerId: 'nice_nano_v2',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    name: '  New  ',
    shieldName: 'corne',
  });
});

it('does not mutate the input', () => {
  renameProject(PROJECT, { name: 'New' });
  expect(PROJECT.name).toBe('Old');
});

it('returns the same reference when the name is unchanged', () => {
  expect(renameProject(PROJECT, { name: 'Old' })).toBe(PROJECT);
});
