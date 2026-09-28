import { expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateProject } from './migrate-project';

it('is at version 2', () => {
  expect(CURRENT_SCHEMA_VERSION).toBe(2);
});

it('returns current-version data unchanged', () => {
  const data = { schemaVersion: 2, name: 'x', keys: [], wires: [], insulatedCrossings: [] };
  expect(migrateProject(data, { fromVersion: 2 })).toBe(data);
});

it('migrates v1 to v2', () => {
  expect(migrateProject({ schemaVersion: 1, name: 'x' }, { fromVersion: 1 })).toEqual({
    schemaVersion: 2,
    name: 'x',
    keys: [],
    wires: [],
    insulatedCrossings: [],
  });
});
