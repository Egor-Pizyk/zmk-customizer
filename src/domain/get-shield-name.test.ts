import { expect, it } from 'vitest';
import { getShieldName } from './get-shield-name';

it('returns the override as typed when present', () => {
  expect(
    getShieldName({
      schemaVersion: 2,
      keys: [],
      wires: [],
      insulatedCrossings: [],
      name: 'My Corne',
      shieldName: '2Bad',
    }),
  ).toBe('2Bad');
});

it('derives the technical name from the name when there is no override', () => {
  expect(
    getShieldName({
      schemaVersion: 2,
      keys: [],
      wires: [],
      insulatedCrossings: [],
      name: 'My Corne',
    }),
  ).toBe('my_corne');
});
