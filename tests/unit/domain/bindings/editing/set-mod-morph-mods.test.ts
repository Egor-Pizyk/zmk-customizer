import { setModMorphMods } from '@domain/bindings/editing';
import { expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';

const KEYS = ['k1', 'k2'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'B', modifiers: [] },
      mods: ['LS'],
    },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  },
});

it('replaces the trigger set of mod-morph keys and leaves others alone', () => {
  const next = setModMorphMods(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1', 'k2'],
    mods: ['RS', 'LG'],
  });
  expect(next.layers[0]?.bindings).toEqual({
    k1: {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'B', modifiers: [] },
      mods: ['LG', 'RS'],
    },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  });
});

it('keeps the project when the trigger set would become empty', () => {
  expect(setModMorphMods(PROJECT, { layerIndex: 0, keyIds: ['k1'], mods: [] })).toBe(PROJECT);
});
