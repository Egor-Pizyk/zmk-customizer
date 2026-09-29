import { expect, it } from 'vitest';
import type { Binding } from '../../domain/types';
import { formatBindingName } from './format-binding-name';

const SPACE = { keycode: 'SPACE', modifiers: [] } as const;

it.each<[Binding | undefined, string]>([
  [undefined, 'Not assigned (does nothing)'],
  [{ kind: 'kp', key: SPACE }, 'Space'],
  [{ kind: 'kp', key: { keycode: 'A', modifiers: ['LC', 'LS'] } }, 'Left Ctrl + Left Shift + A'],
  [{ kind: 'kp', key: { keycode: 'N4', modifiers: [] } }, '4'],
  [{ kind: 'kp', key: { keycode: 'DOLLAR', modifiers: [] } }, '$ (Dollar)'],
  [{ kind: 'kp', key: { keycode: 'C_VOL_UP', modifiers: [] } }, 'Volume Increment'],
  [{ kind: 'kp', key: { keycode: 'BANG', modifiers: [] } }, 'Unknown key BANG'],
  [
    { kind: 'mt', hold: { keycode: 'LSHIFT', modifiers: [] }, tap: SPACE },
    'Space, Left Shift when held',
  ],
  [{ kind: 'sk', key: { keycode: 'LSHIFT', modifiers: [] } }, 'Sticky Left Shift'],
  [{ kind: 'kt', key: { keycode: 'LCTRL', modifiers: [] } }, 'Toggle Left Control'],
  [{ kind: 'trans' }, 'Pass-through'],
  [{ kind: 'none' }, 'Do nothing'],
  [{ kind: 'bt', command: 'BT_SEL', profile: 1 }, 'Bluetooth: select profile 1'],
  [{ kind: 'bt', command: 'BT_CLR_ALL' }, 'Bluetooth: clear all profiles'],
  [{ kind: 'out', command: 'OUT_USB' }, 'Output: USB'],
  [{ kind: 'bootloader' }, 'Bootloader'],
  [{ kind: 'tap_dance', taps: [SPACE], tappingTermMs: 200 }, 'Tap dance Space (200 ms)'],
  [
    {
      kind: 'tap_dance',
      taps: [SPACE, { keycode: 'A', modifiers: ['LC'] }],
      tappingTermMs: 250,
    },
    'Tap dance Space, then Left Ctrl + A (250 ms)',
  ],
  [
    {
      kind: 'mod_morph',
      normal: SPACE,
      morphed: { keycode: 'A', modifiers: [] },
      mods: ['LS'],
    },
    'Mod-morph Space into A with Left Shift',
  ],
])('names %j as %s', (binding, name) => {
  expect(formatBindingName(binding)).toBe(name);
});
