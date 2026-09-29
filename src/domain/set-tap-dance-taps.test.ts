import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setTapDanceTaps } from './set-tap-dance-taps';

const KEYS = ['k1', 'k2', 'k3'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'tap_dance', taps: [{ keycode: 'A', modifiers: [] }], tappingTermMs: 200 },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  },
});

it('replaces the tap list of tap-dance keys and leaves other kinds alone', () => {
  const next = setTapDanceTaps(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1', 'k2', 'k3'],
    taps: [
      { keycode: 'A', modifiers: [] },
      { keycode: 'SPACE', modifiers: [] },
    ],
  });
  expect(next.layers[0]?.bindings).toEqual({
    k1: {
      kind: 'tap_dance',
      taps: [
        { keycode: 'A', modifiers: [] },
        { keycode: 'SPACE', modifiers: [] },
      ],
      tappingTermMs: 200,
    },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  });
});

it('normalizes tap modifiers to union order without duplicates', () => {
  const next = setTapDanceTaps(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1'],
    taps: [{ keycode: 'A', modifiers: ['RS', 'LC', 'LC'] }],
  });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'tap_dance',
    taps: [{ keycode: 'A', modifiers: ['LC', 'RS'] }],
    tappingTermMs: 200,
  });
});

it('keeps the project when the tap list is empty (the editor resets through setBindings)', () => {
  expect(setTapDanceTaps(PROJECT, { layerIndex: 0, keyIds: ['k1'], taps: [] })).toBe(PROJECT);
});
