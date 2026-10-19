import { getShieldName } from '@domain/project';
import { expect, it } from 'vitest';

it('returns the override as typed when present', () => {
  expect(
    getShieldName({
      schemaVersion: 11,
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
      name: 'My Corne',
      shieldName: '2Bad',
    }),
  ).toBe('2Bad');
});

it('derives the technical name from the name when there is no override', () => {
  expect(
    getShieldName({
      schemaVersion: 11,
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
      name: 'My Corne',
    }),
  ).toBe('my_corne');
});
