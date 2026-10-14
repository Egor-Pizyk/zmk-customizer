import { setHoldKey } from '@domain/bindings/editing';
import { expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';

const KEYS = ['k1', 'k2', 'k3'].map((id, index) => ({ id, xU: index, yU: 0 }));
const SPACE = { keycode: 'SPACE', modifiers: [] } as const;
const SHIFT = { keycode: 'LEFT_SHIFT', modifiers: [] } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: SPACE },
    k2: { kind: 'mt', hold: SHIFT, tap: SPACE },
    k3: { kind: 'none' },
  },
});

it('turns key presses into mod-tap and changes an existing hold', () => {
  const ctrl = { keycode: 'LEFT_CONTROL', modifiers: [] } as const;
  const next = setHoldKey(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2', 'k3'], hold: ctrl });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'mt', hold: ctrl, tap: SPACE },
    k2: { kind: 'mt', hold: ctrl, tap: SPACE },
    k3: { kind: 'none' },
  });
});

it('turns mod-tap back into a key press without a hold', () => {
  const next = setHoldKey(PROJECT, { layerIndex: 0, keyIds: ['k2'] });
  expect(next.layers[0]?.bindings['k2']).toEqual({ kind: 'kp', key: SPACE });
  expect(setHoldKey(PROJECT, { layerIndex: 0, keyIds: ['k1'] })).toBe(PROJECT);
});
