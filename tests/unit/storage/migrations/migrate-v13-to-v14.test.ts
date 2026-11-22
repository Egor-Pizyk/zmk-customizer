import { getResultValue } from '../../../helpers/result';
import { describe, expect, it } from 'vitest';
import { migrateProject, CURRENT_SCHEMA_VERSION } from '@storage/migrations';
import { parseProjectFile } from '@storage/project';
import legacy from '../../../fixtures/project/v13.json?raw';
import v1 from '../../../fixtures/project/v1.json?raw';

const INPUT = { schemaVersion: 13, keys: [{ id: 'k0' }], wires: [{ id: 'w0' }] };

describe('v13 to v14 migration', () => {
  it('only advances the version and never regenerates legacy geometry', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(14);
    expect(migrateProject(INPUT, { fromVersion: 13 })).toEqual({ ...INPUT, schemaVersion: 14 });
    expect(INPUT.schemaVersion).toBe(13);
  });

  it.each([legacy, v1])('keeps historical files loadable in version 14', (raw) => {
    expect(getResultValue(parseProjectFile(raw)).schemaVersion).toBe(14);
  });
});

const historicalFiles = import.meta.glob<string>('../../../fixtures/project/v*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

it.each(Object.entries(historicalFiles))(
  'loads frozen project fixture %s without wire regeneration',
  (_path, raw) => {
    expect(getResultValue(parseProjectFile(raw)).schemaVersion).toBe(14);
  },
);
