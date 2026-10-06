import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setKeyBehavior } from './set-key-behavior';

const KEYS = ['k1', 'k2', 'k3', 'k4'].map((id, index) => ({ id, xU: index, yU: 0 }));
const CTRL_A = { keycode: 'A', modifiers: ['LC'] } as const;
const KEY_B = { keycode: 'B', modifiers: [] } as const;
const LEFT_ALT = { keycode: 'LEFT_ALT', modifiers: [] } as const;
const LEFT_SHIFT = { keycode: 'LEFT_SHIFT', modifiers: [] } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: CTRL_A },
    k2: { kind: 'mt', hold: LEFT_ALT, tap: KEY_B },
    k3: { kind: 'sk', key: KEY_B },
    k4: { kind: 'trans' },
  },
});
const ALL = { layerIndex: 0, keyIds: ['k1', 'k2', 'k3', 'k4'] };

it('makes every key-sending key sticky, keeping its key and leaving other kinds alone', () => {
  const next = setKeyBehavior(PROJECT, { ...ALL, behavior: { id: 'sk' } });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'sk', key: CTRL_A },
    k2: { kind: 'sk', key: KEY_B },
    k3: { kind: 'sk', key: KEY_B },
    k4: { kind: 'trans' },
  });
});

it('turns keys into mod-tap with the given hold, keeping an existing hold', () => {
  const next = setKeyBehavior(PROJECT, { ...ALL, behavior: { id: 'mt', hold: LEFT_SHIFT } });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'mt', hold: LEFT_SHIFT, tap: CTRL_A },
    k2: { kind: 'mt', hold: LEFT_ALT, tap: KEY_B },
    k3: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_B },
    k4: { kind: 'trans' },
  });
});

it('turns mod-tap, sticky and toggle keys back into key presses', () => {
  const next = setKeyBehavior(PROJECT, { ...ALL, behavior: { id: 'kp' } });
  expect(next.layers[0]?.bindings['k2']).toEqual({ kind: 'kp', key: KEY_B });
  expect(next.layers[0]?.bindings['k3']).toEqual({ kind: 'kp', key: KEY_B });
  const toggled = setKeyBehavior(PROJECT, {
    layerIndex: 0,
    keyIds: ['k1'],
    behavior: { id: 'kt' },
  });
  expect(toggled.layers[0]?.bindings['k1']).toEqual({ kind: 'kt', key: CTRL_A });
});

it('returns the same project when nothing changes', () => {
  expect(
    setKeyBehavior(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k4'], behavior: { id: 'kp' } }),
  ).toBe(PROJECT);
});
