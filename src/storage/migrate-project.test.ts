import { expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateProject } from './migrate-project';

it('is at version 6', () => {
  expect(CURRENT_SCHEMA_VERSION).toBe(6);
});

it('returns current-version data unchanged', () => {
  const data = {
    schemaVersion: 6,
    controllerId: 'nice_nano_v2',
    name: 'x',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
  expect(migrateProject(data, { fromVersion: 5 })).toBe(data);
});

it('migrates v1 through v2 and v3 to v4', () => {
  expect(migrateProject({ schemaVersion: 1, name: 'x' }, { fromVersion: 1 })).toEqual({
    schemaVersion: 6,
    controllerId: 'nice_nano_v2',
    name: 'x',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
});

it('throws for a migration without a step', () => {
  expect(() => migrateProject({}, { fromVersion: 0 })).toThrow('Missing project migration v0 → v1');
});
