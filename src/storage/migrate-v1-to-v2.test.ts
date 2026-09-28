import { expect, it } from 'vitest';
import { migrateV1ToV2 } from './migrate-v1-to-v2';

it('adds an empty schematic and bumps the version', () => {
  expect(migrateV1ToV2({ schemaVersion: 1, name: 'x', shieldName: 'y' })).toEqual({
    schemaVersion: 2,
    name: 'x',
    shieldName: 'y',
    keys: [],
    wires: [],
    insulatedCrossings: [],
  });
});

it('leaves a non-object for the schema to reject', () => {
  expect(migrateV1ToV2('nope')).toBe('nope');
});
