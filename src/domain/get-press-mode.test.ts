import { expect, it } from 'vitest';
import { getPressMode } from './get-press-mode';

const KEY_A = { keycode: 'A', modifiers: [] } as const;

it.each([
  [{ kind: 'kp', key: KEY_A }, 'normal'],
  [{ kind: 'mt', hold: KEY_A, tap: KEY_A }, 'normal'],
  [{ kind: 'sk', key: KEY_A }, 'sticky'],
  [{ kind: 'kt', key: KEY_A }, 'toggle'],
  [{ kind: 'none' }, undefined],
  [{ kind: 'trans' }, undefined],
  [{ kind: 'caps_word' }, undefined],
  [{ kind: 'key_repeat' }, undefined],
  [{ kind: 'gresc' }, undefined],
  [{ kind: 'bt', command: 'BT_NXT' }, undefined],
  [{ kind: 'out', command: 'OUT_USB' }, undefined],
  [{ kind: 'sys_reset' }, undefined],
  [{ kind: 'bootloader' }, undefined],
  [{ kind: 'tap_dance', taps: [KEY_A], tappingTermMs: 200 }, undefined],
  [{ kind: 'mod_morph', normal: KEY_A, morphed: KEY_A, mods: ['LS'] }, undefined],
  [undefined, undefined],
] as const)('%j is %s', (binding, mode) => {
  expect(getPressMode(binding)).toBe(mode);
});
