import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { isEveryKeyPress } from './is-every-key-press';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
  { id: 'k3', xU: 2, yU: 0 },
];
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
    k3: { kind: 'none' },
  },
});

it('is true when every listed key sends a key', () => {
  expect(isEveryKeyPress(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2'] })).toBe(true);
});

it('is false for other kinds, unassigned keys or no keys', () => {
  expect(isEveryKeyPress(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k3'] })).toBe(false);
  expect(isEveryKeyPress(buildProject({ keys: KEYS }), { layerIndex: 0, keyIds: ['k1'] })).toBe(
    false,
  );
  expect(isEveryKeyPress(PROJECT, { layerIndex: 0, keyIds: [] })).toBe(false);
});

it('counts mod-tap keys as sending a key', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: {
        kind: 'mt',
        hold: { keycode: 'LSHIFT', modifiers: [] },
        tap: { keycode: 'A', modifiers: [] },
      },
    },
  });
  expect(isEveryKeyPress(project, { layerIndex: 0, keyIds: ['k1'] })).toBe(true);
});
