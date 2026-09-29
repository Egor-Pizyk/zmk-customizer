import { expect, it } from 'vitest';
import fixtureV2 from '../../tests/fixtures/project/v2.json?raw';
import { migrateV2ToV3 } from './migrate-v2-to-v3';

it('adds one empty Base layer and bumps the version', () => {
  const data: unknown = JSON.parse(fixtureV2);
  expect(migrateV2ToV3(data)).toEqual({
    schemaVersion: 3,
    name: 'Two keys',
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'key-pin', keyId: 'k2', pin: 1 },
        bends: [],
      },
    ],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
});

it.each([[['nope']], [null], [42], ['x'], [undefined]])(
  'leaves a non-object %j for the schema to reject',
  (value) => {
    expect(migrateV2ToV3(value)).toBe(value);
  },
);
