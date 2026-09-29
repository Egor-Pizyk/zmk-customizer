import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setPressMode } from './set-press-mode';

const KEYS = ['k1', 'k2', 'k3'].map((id, index) => ({ id, xU: index, yU: 0 }));
const KEY_A = { keycode: 'A', modifiers: [] } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: KEY_A },
    k2: { kind: 'mt', hold: { keycode: 'LEFT_SHIFT', modifiers: [] }, tap: KEY_A },
    k3: { kind: 'trans' },
  },
});

it('makes key-sending keys sticky and leaves other kinds alone', () => {
  const next = setPressMode(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2', 'k3'], mode: 'sticky' });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'sk', key: KEY_A },
    k2: { kind: 'sk', key: KEY_A },
    k3: { kind: 'trans' },
  });
});

it('turns toggle back into a normal key press, keeping mod-tap as normal', () => {
  const toggled = setPressMode(PROJECT, { layerIndex: 0, keyIds: ['k1'], mode: 'toggle' });
  expect(toggled.layers[0]?.bindings['k1']).toEqual({ kind: 'kt', key: KEY_A });
  const normal = setPressMode(toggled, { layerIndex: 0, keyIds: ['k1', 'k2'], mode: 'normal' });
  expect(normal.layers[0]?.bindings['k1']).toEqual({ kind: 'kp', key: KEY_A });
  expect(normal.layers[0]?.bindings['k2']).toEqual(PROJECT.layers[0]?.bindings['k2']);
  expect(setPressMode(PROJECT, { layerIndex: 0, keyIds: ['k1'], mode: 'normal' })).toBe(PROJECT);
});
