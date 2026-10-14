import { setModMorphKeys } from '@domain/bindings/editing';
import { expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';

const KEYS = ['k1', 'k2'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'A', modifiers: [] },
      mods: ['LS'],
    },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  },
});

it('replaces the normal and morphed actions of mod-morph keys and leaves others alone', () => {
  const next = setModMorphKeys(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1', 'k2'],
    normal: { keycode: 'ESCAPE', modifiers: [] },
    morphed: { keycode: 'GRAVE', modifiers: ['RS'] },
  });
  expect(next.layers[0]?.bindings).toEqual({
    k1: {
      kind: 'mod_morph',
      normal: { keycode: 'ESCAPE', modifiers: [] },
      morphed: { keycode: 'GRAVE', modifiers: ['RS'] },
      mods: ['LS'],
    },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  });
});

it('normalizes action modifiers to union order without duplicates', () => {
  const next = setModMorphKeys(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1'],
    normal: { keycode: 'A', modifiers: ['RS', 'LC', 'LC'] },
    morphed: { keycode: 'B', modifiers: [] },
  });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'mod_morph',
    normal: { keycode: 'A', modifiers: ['LC', 'RS'] },
    morphed: { keycode: 'B', modifiers: [] },
    mods: ['LS'],
  });
});
