import { expect, it } from 'vitest';
import { createEntityId } from './create-entity-id';

it('starts at 1 when nothing exists', () => {
  expect(createEntityId({ prefix: 'k', existingIds: [] })).toBe('k1');
});

it('takes the highest existing number plus one, ignoring order and gaps', () => {
  expect(createEntityId({ prefix: 'w', existingIds: ['w2', 'w10', 'w3'] })).toBe('w11');
});

it('ignores ids with another prefix', () => {
  expect(createEntityId({ prefix: 'k', existingIds: ['w7', 'k2'] })).toBe('k3');
});

it('creates layer ids (spec 007)', () => {
  expect(createEntityId({ prefix: 'l', existingIds: ['l0', 'l3'] })).toBe('l4');
});
