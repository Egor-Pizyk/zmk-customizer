import { isEveryKeySendingKey } from '@domain/bindings';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

const KEYS = ['k1', 'k2', 'k3', 'k4', 'k5'].map((id, index) => ({ id, xU: index, yU: 0 }));
const KEY_A = { keycode: 'A', modifiers: [] } as const;
const PROJECT = buildProject({
  keys: KEYS,
  bindings: {
    k1: { kind: 'kp', key: KEY_A },
    k2: { kind: 'sk', key: KEY_A },
    k3: { kind: 'kt', key: KEY_A },
    k4: { kind: 'mt', hold: { keycode: 'LEFT_SHIFT', modifiers: [] }, tap: KEY_A },
    k5: { kind: 'bt', command: 'BT_NXT' },
  },
});

it('is true when every listed key is a key press, sticky, toggle or mod-tap key', () => {
  expect(isEveryKeySendingKey(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2', 'k3', 'k4'] })).toBe(
    true,
  );
});

it('is false for other kinds, unassigned keys or no keys', () => {
  expect(isEveryKeySendingKey(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k5'] })).toBe(false);
  expect(
    isEveryKeySendingKey(buildProject({ keys: KEYS }), { layerIndex: 0, keyIds: ['k1'] }),
  ).toBe(false);
  expect(isEveryKeySendingKey(PROJECT, { layerIndex: 0, keyIds: [] })).toBe(false);
});

it('counts layer-tap as sending its tap key (spec 007)', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: { kind: 'lt', layerId: 'l1', tap: KEY_A },
      k2: { kind: 'mo', layerId: 'l1' },
    },
  });
  expect(isEveryKeySendingKey(project, { layerIndex: 0, keyIds: ['k1'] })).toBe(true);
  expect(isEveryKeySendingKey(project, { layerIndex: 0, keyIds: ['k1', 'k2'] })).toBe(false);
});
