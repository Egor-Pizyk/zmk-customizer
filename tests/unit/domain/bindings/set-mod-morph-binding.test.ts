import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { setModMorphBinding } from '@domain';

const KEYS = ['k1', 'k2', 'k3', 'k4'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: { keycode: 'ESCAPE', modifiers: [] } },
    k2: {
      kind: 'mt',
      hold: { keycode: 'LSHIFT', modifiers: [] },
      tap: { keycode: 'S', modifiers: ['LC'] },
    },
    k3: { kind: 'none' },
  },
});

it('seeds normal and morphed from the key each key sends, triggered by left shift', () => {
  const next = setModMorphBinding(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2', 'k3', 'k4'] });
  expect(next.layers[0]?.bindings).toEqual({
    k1: {
      kind: 'mod_morph',
      normal: { keycode: 'ESCAPE', modifiers: [] },
      morphed: { keycode: 'ESCAPE', modifiers: [] },
      mods: ['LS'],
    },
    k2: {
      kind: 'mod_morph',
      normal: { keycode: 'S', modifiers: ['LC'] },
      morphed: { keycode: 'S', modifiers: ['LC'] },
      mods: ['LS'],
    },
    k3: {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'A', modifiers: [] },
      mods: ['LS'],
    },
    k4: {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'A', modifiers: [] },
      mods: ['LS'],
    },
  });
});

it('returns the same project when every key already morphs the same starter', () => {
  const once = setModMorphBinding(PROJECT, { layerIndex: 0, keyIds: ['k4'] });
  expect(setModMorphBinding(once, { layerIndex: 0, keyIds: ['k4'] })).toBe(once);
});
