import { expect, it } from 'vitest';
import { KEYCODES } from '../../catalog/keycodes';
import type { Binding, Modifier } from '../../domain/types';
import {
  countGraphemes,
  formatBindingLegend,
  formatFullBindingLegend,
} from './format-binding-legend';

function kp(keycode: string, modifiers: readonly Modifier[] = []): Binding {
  return { kind: 'kp', key: { keycode, modifiers } };
}

it.each<[string, Binding | undefined, ReturnType<typeof formatBindingLegend>]>([
  ['unassigned', undefined, undefined],
  ['a letter', kp('A'), { tap: 'A' }],
  ['modifiers in fixed order', kp('A', ['LC', 'LS']), { tap: '⌃⇧A' }],
  ['a right modifier', kp('A', ['RG']), { tap: 'R⌘A' }],
  ['a digit', kp('N4'), { tap: '4' }],
  ['a named shifted symbol', kp('DOLLAR'), { tap: '$' }],
  ['a digit with left shift', kp('N4', ['LS']), { tap: '$' }],
  ['a digit with right shift', kp('NUMBER_4', ['RS']), { tap: '$' }],
  ['a shifted symbol with ctrl', kp('DOLLAR', ['LC']), { tap: '⌃$' }],
  ['a symbol from the description', kp('MINUS'), { tap: '-' }],
  ['a special key', kp('SPACE'), { tap: '␣' }],
  ['a function key', kp('F13'), { tap: 'F13' }],
  ['a short alias instead of truncating', kp('C_AL_CALCULATOR'), { tap: 'C_ALCL' }],
  ['an abbreviation that keeps the prefix', kp('C_AC_REFRESH'), { tap: 'C_ACRF' }],
  ['an abbreviation with middle initials', kp('C_MENU_INCREASE'), { tap: 'C_MNCRS' }],
  ['a full-length keycode id', kp('C_RESET'), { tap: 'C_RESET' }],
  ['an unknown keycode', kp('BANG'), { tap: '?BANG' }],
  [
    'all eight modifiers, capped to fit the keycap (FR-007)',
    kp('A', ['LC', 'LS', 'LA', 'LG', 'RC', 'RS', 'RA', 'RG']),
    { tap: '⌃⇧⌥⌘R⌃…' },
  ],
  ['modifiers with a word legend, capped', kp('PRINTSCREEN', ['LC', 'LS']), { tap: '⌃⇧PrtSc' }],
  [
    'mod-tap',
    {
      kind: 'mt',
      hold: { keycode: 'LSHIFT', modifiers: [] },
      tap: { keycode: 'SPACE', modifiers: [] },
    },
    { tap: '␣', hold: '⇧' },
  ],
  [
    'sticky key',
    { kind: 'sk', key: { keycode: 'LSHIFT', modifiers: [] } },
    { tap: '⇧', hold: 'STK' },
  ],
  [
    'key toggle',
    { kind: 'kt', key: { keycode: 'LCTRL', modifiers: [] } },
    { tap: '⌃', hold: 'TOG' },
  ],
  ['pass-through', { kind: 'trans' }, { tap: '▽' }],
  ['do nothing', { kind: 'none' }, { tap: '✕' }],
  ['caps word', { kind: 'caps_word' }, { tap: 'CW' }],
  ['key repeat', { kind: 'key_repeat' }, { tap: 'REP' }],
  ['grave escape', { kind: 'gresc' }, { tap: '⎋`' }],
  ['select profile', { kind: 'bt', command: 'BT_SEL', profile: 1 }, { tap: 'BT 1' }],
  ['disconnect profile', { kind: 'bt', command: 'BT_DISC', profile: 2 }, { tap: 'BT✕2' }],
  ['next profile', { kind: 'bt', command: 'BT_NXT' }, { tap: 'BT→' }],
  ['eject', kp('C_EJECT'), { tap: '⏏' }],
  ['output usb', { kind: 'out', command: 'OUT_USB' }, { tap: 'USB' }],
  ['bootloader', { kind: 'bootloader' }, { tap: 'BOOT' }],
  [
    'tap dance with one tap',
    { kind: 'tap_dance', taps: [{ keycode: 'A', modifiers: [] }], tappingTermMs: 200 },
    { tap: 'A', hold: 'TD' },
  ],
  [
    'tap dance with two taps',
    {
      kind: 'tap_dance',
      taps: [
        { keycode: 'A', modifiers: [] },
        { keycode: 'SPACE', modifiers: [] },
      ],
      tappingTermMs: 250,
    },
    { tap: 'A', hold: '␣' },
  ],
  [
    'tap dance with three taps',
    {
      kind: 'tap_dance',
      taps: [
        { keycode: 'A', modifiers: [] },
        { keycode: 'B', modifiers: [] },
        { keycode: 'C', modifiers: [] },
      ],
      tappingTermMs: 200,
    },
    { tap: 'A', hold: '+2' },
  ],
  [
    'mod-morph',
    {
      kind: 'mod_morph',
      normal: { keycode: 'ESCAPE', modifiers: [] },
      morphed: { keycode: 'GRAVE', modifiers: [] },
      mods: ['LS'],
    },
    { tap: '⎋', hold: '~' },
  ],
  [
    'mod-morph with several triggers',
    {
      kind: 'mod_morph',
      normal: { keycode: 'A', modifiers: [] },
      morphed: { keycode: 'B', modifiers: [] },
      mods: ['LC', 'RS'],
    },
    { tap: 'A', hold: '⌃R⇧B' },
  ],
])('formats %s', (_label, binding, legend) => {
  expect(formatBindingLegend(binding)).toEqual(legend);
});

it.each<[string, Binding | undefined, ReturnType<typeof formatFullBindingLegend>]>([
  ['unassigned', undefined, undefined],
  ['a short legend unchanged', kp('A'), { tap: 'A' }],
  ['a long keycode id in full', kp('C_RESET'), { tap: 'C_RESET' }],
  [
    'all modifiers uncapped',
    kp('A', ['LC', 'LS', 'LA', 'LG', 'RC', 'RS', 'RA', 'RG']),
    { tap: '⌃⇧⌥⌘R⌃R⇧R⌥R⌘A' },
  ],
  ['modifiers with a word legend in full', kp('PRINTSCREEN', ['LC', 'LS']), { tap: '⌃⇧PrtSc' }],
  [
    'tap dance in full lists every tap',
    {
      kind: 'tap_dance',
      taps: [
        { keycode: 'A', modifiers: [] },
        { keycode: 'B', modifiers: [] },
        { keycode: 'C', modifiers: [] },
      ],
      tappingTermMs: 200,
    },
    { tap: 'A', hold: 'B/C' },
  ],
])('formats the full %s', (_label, binding, legend) => {
  expect(formatFullBindingLegend(binding)).toEqual(legend);
});

it('gives every keycode a unique legend that fits the keycap', () => {
  const legends = KEYCODES.map((keycode) => formatBindingLegend(kp(keycode.name)));
  expect(legends).not.toContain(undefined);
  const taps = legends.filter((legend) => legend !== undefined).map((legend) => legend.tap);
  expect(taps.length).toBe(KEYCODES.length);
  expect(new Set(taps).size).toBe(taps.length);
  for (const tap of taps) {
    expect(tap).not.toContain('…');
    expect(countGraphemes(tap)).toBeLessThanOrEqual(7);
  }
});
