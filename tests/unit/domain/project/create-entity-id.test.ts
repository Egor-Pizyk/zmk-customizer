import { expect, it } from 'vitest';
import { createEntityId } from '@domain';

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

it.each(['k', 'w', 'l'] as const)(
  'allocates %s ids beyond Number precision without exponent notation',
  (prefix) => {
    expect(createEntityId({ prefix, existingIds: [`${prefix}9007199254740992`] })).toBe(
      `${prefix}9007199254740993`,
    );
    expect(
      createEntityId({ prefix, existingIds: [`${prefix}999999999999999999999999999999`] }),
    ).toBe(`${prefix}1000000000000000000000000000000`);
    expect(createEntityId({ prefix, existingIds: [`${prefix}0009`, `${prefix}10`] })).toBe(
      `${prefix}11`,
    );
  },
);

it('ignores non-decimal suffixes', () => {
  expect(createEntityId({ prefix: 'k', existingIds: ['k1e3', 'k', 'k-2', 'k2.5', 'k3'] })).toBe(
    'k4',
  );
});
