import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setTapDanceBinding } from './set-tap-dance-binding';

const KEYS = ['k1', 'k2', 'k3', 'k4'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LC'] } },
    k2: {
      kind: 'mt',
      hold: { keycode: 'LSHIFT', modifiers: [] },
      tap: { keycode: 'S', modifiers: [] },
    },
    k3: { kind: 'none' },
  },
});

it('seeds each key from its own tap stroke, else from a plain A, with a 200 ms pause', () => {
  const next = setTapDanceBinding(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2', 'k3', 'k4'] });
  expect(next.layers[0]?.bindings).toEqual({
    k1: {
      kind: 'tap_dance',
      taps: [{ keycode: 'A', modifiers: ['LC'] }],
      tappingTermMs: 200,
    },
    k2: {
      kind: 'tap_dance',
      taps: [{ keycode: 'S', modifiers: [] }],
      tappingTermMs: 200,
    },
    k3: {
      kind: 'tap_dance',
      taps: [{ keycode: 'A', modifiers: [] }],
      tappingTermMs: 200,
    },
    k4: {
      kind: 'tap_dance',
      taps: [{ keycode: 'A', modifiers: [] }],
      tappingTermMs: 200,
    },
  });
});

it('returns the same project when every key already dances the same starter', () => {
  const once = setTapDanceBinding(PROJECT, { layerIndex: 0, keyIds: ['k4'] });
  expect(setTapDanceBinding(once, { layerIndex: 0, keyIds: ['k4'] })).toBe(once);
});
