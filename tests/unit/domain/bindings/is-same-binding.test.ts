import { expect, it } from 'vitest';
import { isSameBinding } from '@domain';

it('compares bindings by value, ignoring property order', () => {
  expect(
    isSameBinding(
      { kind: 'bt', command: 'BT_SEL', profile: 1 },
      { profile: 1, command: 'BT_SEL', kind: 'bt' },
    ),
  ).toBe(true);
  expect(
    isSameBinding(
      { kind: 'kp', key: { keycode: 'A', modifiers: ['LC'] } },
      { key: { modifiers: ['LC'], keycode: 'A' }, kind: 'kp' },
    ),
  ).toBe(true);
});

it('tells different bindings and modifier order apart', () => {
  expect(isSameBinding({ kind: 'none' }, { kind: 'trans' })).toBe(false);
  expect(
    isSameBinding(
      { kind: 'kp', key: { keycode: 'A', modifiers: ['LC', 'LS'] } },
      { kind: 'kp', key: { keycode: 'A', modifiers: ['LS', 'LC'] } },
    ),
  ).toBe(false);
});

it('treats undefined as unassigned', () => {
  expect(isSameBinding(undefined, { kind: 'none' })).toBe(false);
});
