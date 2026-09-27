import { expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateProject } from './migrate-project';

it('is at version 1', () => {
  expect(CURRENT_SCHEMA_VERSION).toBe(1);
});

it('returns current-version data unchanged', () => {
  const data = { schemaVersion: 1, name: 'x' };
  expect(migrateProject(data, { fromVersion: 1 })).toBe(data);
});
