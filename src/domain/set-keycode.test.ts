import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setKeycode } from './set-keycode';

const KEYS = ['k1', 'k2', 'k3', 'k4', 'k5'].map((id, index) => ({ id, xU: index, yU: 0 }));
const KEY_A = { keycode: 'A', modifiers: ['LC'] } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: KEY_A },
    k2: { kind: 'mt', hold: { keycode: 'LSHIFT', modifiers: [] }, tap: KEY_A },
    k3: { kind: 'sk', key: { keycode: 'LSHIFT', modifiers: [] } },
    k4: { kind: 'bt', command: 'BT_NXT' },
  },
});

it('replaces the key and keeps each key mode, hold and modifiers', () => {
  const next = setKeycode(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1', 'k2', 'k3', 'k4', 'k5'],
    keycode: 'S',
    modifiers: ['RG'],
  });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'kp', key: { keycode: 'S', modifiers: ['LC'] } },
    k2: {
      kind: 'mt',
      hold: { keycode: 'LSHIFT', modifiers: [] },
      tap: { keycode: 'S', modifiers: ['LC'] },
    },
    k3: { kind: 'sk', key: { keycode: 'S', modifiers: [] } },
    k4: { kind: 'kp', key: { keycode: 'S', modifiers: ['RG'] } },
    k5: { kind: 'kp', key: { keycode: 'S', modifiers: ['RG'] } },
  });
});

it('returns the same project when nothing changes', () => {
  expect(setKeycode(PROJECT, { layerIndex: 0, keyIds: ['k1'], keycode: 'A', modifiers: [] })).toBe(
    PROJECT,
  );
});

it('normalizes new modifiers to union order without duplicates', () => {
  const next = setKeycode(PROJECT, {
    layerIndex: 0,
    keyIds: ['k5'],
    keycode: 'S',
    modifiers: ['LS', 'LC', 'LC'],
  });
  expect(next.layers[0]?.bindings['k5']).toEqual({
    kind: 'kp',
    key: { keycode: 'S', modifiers: ['LC', 'LS'] },
  });
});

it('replaces the tap key of layer-tap, keeping its modifiers and layer', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: { k1: { kind: 'lt', layerId: 'l1', tap: KEY_A } },
  });
  const next = setKeycode(project, { layerIndex: 0, keyIds: ['k1'], keycode: 'S', modifiers: [] });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'lt',
    layerId: 'l1',
    tap: { keycode: 'S', modifiers: ['LC'] },
  });
});
