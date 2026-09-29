import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setTappingTerm } from './set-tapping-term';

const KEYS = ['k1', 'k2'].map((id, index) => ({ id, xU: index, yU: 0 }));
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'tap_dance', taps: [{ keycode: 'A', modifiers: [] }], tappingTermMs: 200 },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  },
});

it('updates the pause of tap-dance keys and leaves other kinds alone', () => {
  const next = setTappingTerm(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2'], tappingTermMs: 350 });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'tap_dance', taps: [{ keycode: 'A', modifiers: [] }], tappingTermMs: 350 },
    k2: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
  });
});

it('stores an out-of-range pause as given (validation reports it)', () => {
  const next = setTappingTerm(PROJECT, { layerIndex: 0, keyIds: ['k1'], tappingTermMs: 6000 });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'tap_dance',
    taps: [{ keycode: 'A', modifiers: [] }],
    tappingTermMs: 6000,
  });
});
