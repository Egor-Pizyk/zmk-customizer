import { expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateProject } from './migrate-project';

it('is at version 3', () => {
  expect(CURRENT_SCHEMA_VERSION).toBe(3);
});

it('returns current-version data unchanged', () => {
  const data = {
    schemaVersion: 3,
    name: 'x',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
  expect(migrateProject(data, { fromVersion: 3 })).toBe(data);
});

it('migrates v1 through v2 to v3', () => {
  expect(migrateProject({ schemaVersion: 1, name: 'x' }, { fromVersion: 1 })).toEqual({
    schemaVersion: 3,
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
