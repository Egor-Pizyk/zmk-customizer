import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import type { Binding } from './types';
import { getSharedBinding } from './get-shared-binding';
import type { SharedBinding } from './get-shared-binding';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
  { id: 'k3', xU: 2, yU: 0 },
];
const SPACE = { kind: 'kp', key: { keycode: 'SPACE', modifiers: [] } } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: { k1: SPACE, k2: { kind: 'kp', key: { keycode: 'SPACE', modifiers: [] } } },
});

it('is unassigned for no keys or only unassigned keys', () => {
  expect(getSharedBinding(PROJECT, { layerIndex: 0, keyIds: [] })).toEqual({ kind: 'unassigned' });
  expect(getSharedBinding(PROJECT, { layerIndex: 0, keyIds: ['k3'] })).toEqual({
    kind: 'unassigned',
  });
});

it('is the same binding when all bindings are deep-equal', () => {
  expect(getSharedBinding(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2'] })).toEqual({
    kind: 'same',
    binding: SPACE,
  });
});

it('is mixed when bindings differ or some keys are unassigned', () => {
  expect(getSharedBinding(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k3'] })).toEqual({
    kind: 'mixed',
  });
});

it('is unassigned for a missing layer', () => {
  expect(getSharedBinding(PROJECT, { layerIndex: 2, keyIds: ['k1'] })).toEqual({
    kind: 'unassigned',
  });
});

it('returns the live project reference without cloning', () => {
  const shared = getSharedBinding(PROJECT, { layerIndex: 0, keyIds: ['k1'] });
  expect(sameBindingOf(shared)).toBe(PROJECT.layers[0]?.bindings['k1']);
});

function sameBindingOf(shared: SharedBinding): Binding {
  if (shared.kind !== 'same') {
    throw new Error('expected a shared same binding');
  }
  return shared.binding;
}
