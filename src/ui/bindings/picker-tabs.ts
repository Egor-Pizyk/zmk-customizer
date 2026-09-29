import { BLUETOOTH_PROFILE_COUNT } from '../../catalog/bluetooth-commands';
import { KEYCODES, MODIFIER_KEYCODES, keycodeByName } from '../../catalog/keycodes';
import type { KeycodeCategory } from '../../catalog/parse-keys-header';
import { isSameBinding } from '../../domain/is-same-binding';
import type { Binding } from '../../domain/types';
import { toBindingItem, toKeycodeItem } from './to-picker-item';
import type { PickerItem } from './to-picker-item';

export type PickerTabId = 'basic' | 'nav' | 'function' | 'media' | 'mods' | 'system' | 'more';
export type PickerRow = { readonly label?: string; readonly items: readonly PickerItem[] };
export type PickerTab = {
  readonly id: PickerTabId;
  readonly label: string;
  readonly rows: readonly PickerRow[];
};

type KeySpec = string | readonly [name: string, widthU: number];

function toRow(specs: readonly KeySpec[], label?: string): PickerRow {
  const items = specs.flatMap((spec) =>
    typeof spec === 'string' ? toKeycodeItem(spec) : toKeycodeItem(...spec),
  );
  return label === undefined ? { items } : { label, items };
}

// A US ANSI layout (spec 004 FR-010); widths in key units.
const BASIC_ROWS: readonly (readonly KeySpec[])[] = [
  [
    'GRAVE',
    'N1',
    'N2',
    'N3',
    'N4',
    'N5',
    'N6',
    'N7',
    'N8',
    'N9',
    'N0',
    'MINUS',
    'EQUAL',
    ['BACKSPACE', 2],
  ],
  [
    ['TAB', 1.5],
    'Q',
    'W',
    'E',
    'R',
    'T',
    'Y',
    'U',
    'I',
    'O',
    'P',
    'LEFT_BRACKET',
    'RIGHT_BRACKET',
    ['BACKSLASH', 1.5],
  ],
  [
    ['ESCAPE', 1.75],
    'A',
    'S',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'SEMICOLON',
    'SINGLE_QUOTE',
    ['RETURN', 2.25],
  ],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'COMMA', 'PERIOD', 'SLASH'],
  [['SPACE', 6.25]],
];

const NAV_ROWS: readonly (readonly KeySpec[])[] = [
  ['INSERT', 'HOME', 'PAGE_UP'],
  ['DELETE', 'END', 'PAGE_DOWN'],
  ['UP_ARROW'],
  ['LEFT_ARROW', 'DOWN_ARROW', 'RIGHT_ARROW'],
  ['PRINTSCREEN', 'SCROLLLOCK', 'PAUSE_BREAK', 'CAPSLOCK', 'K_APPLICATION'],
];

const MEDIA_ROW: readonly KeySpec[] = [
  'C_PLAY_PAUSE',
  'C_PREVIOUS',
  'C_NEXT',
  'C_STOP',
  'C_REWIND',
  'C_FAST_FORWARD',
  'C_RECORD',
  'C_EJECT',
  'C_MUTE',
  'C_VOLUME_DOWN',
  'C_VOLUME_UP',
  'C_BRIGHTNESS_DEC',
  'C_BRIGHTNESS_INC',
];

const F_ROWS = [1, 13].map((start) =>
  Array.from({ length: 12 }, (_, offset) => `F${start + offset}`),
);

const PROFILES = Array.from({ length: BLUETOOTH_PROFILE_COUNT }, (_, profile) => profile);

const SYSTEM_ROWS: readonly PickerRow[] = [
  {
    label: 'Special',
    items: (['none', 'trans', 'caps_word', 'key_repeat', 'gresc'] as const).map((kind) =>
      toBindingItem({ kind }),
    ),
  },
  {
    label: 'Bluetooth select',
    items: PROFILES.map((profile) => toBindingItem({ kind: 'bt', command: 'BT_SEL', profile })),
  },
  {
    label: 'Bluetooth disconnect',
    items: PROFILES.map((profile) => toBindingItem({ kind: 'bt', command: 'BT_DISC', profile })),
  },
  {
    label: 'Bluetooth',
    items: (['BT_NXT', 'BT_PRV', 'BT_CLR', 'BT_CLR_ALL'] as const).map((command) =>
      toBindingItem({ kind: 'bt', command }),
    ),
  },
  {
    label: 'Output',
    items: (['OUT_TOG', 'OUT_USB', 'OUT_BLE'] as const).map((command) =>
      toBindingItem({ kind: 'out', command }),
    ),
  },
  {
    label: 'Firmware',
    items: (['sys_reset', 'bootloader'] as const).map((kind) => toBindingItem({ kind })),
  },
];

const MORE_LABELS: Record<KeycodeCategory, string> = {
  letters: 'Letters',
  numbers: 'Numbers',
  symbols: 'Symbols',
  'whitespace-editing': 'Editing',
  navigation: 'Navigation',
  function: 'Function keys',
  modifiers: 'Modifiers',
  keypad: 'Keypad',
  'media-consumer': 'Media and consumer',
  locks: 'Locks',
  'international-language': 'International and language',
  power: 'Power',
  other: 'Other',
};

const PLACED_TABS: readonly PickerTab[] = [
  { id: 'basic', label: 'Basic', rows: BASIC_ROWS.map((row) => toRow(row)) },
  { id: 'nav', label: 'Nav', rows: NAV_ROWS.map((row) => toRow(row)) },
  { id: 'function', label: 'F keys', rows: F_ROWS.map((row) => toRow(row)) },
  { id: 'media', label: 'Media', rows: [toRow(MEDIA_ROW)] },
  {
    id: 'mods',
    label: 'Mods',
    rows: [MODIFIER_KEYCODES.slice(0, 4), MODIFIER_KEYCODES.slice(4)].map((row) =>
      toRow(row.map((keycode) => keycode.name)),
    ),
  },
  { id: 'system', label: 'System', rows: SYSTEM_ROWS },
];

function toMoreRows(): readonly PickerRow[] {
  const placed = new Set(
    PLACED_TABS.flatMap((tab) => tab.rows.flatMap((row) => row.items.map((item) => item.id))),
  );
  const rest = KEYCODES.filter((keycode) => !placed.has(keycode.name));
  return Object.entries(MORE_LABELS).flatMap(([category, label]) => {
    const names = rest
      .filter((keycode) => keycode.category === category)
      .map((keycode) => keycode.name);
    return names.length === 0 ? [] : [toRow(names, label)];
  });
}

export const PICKER_TABS: readonly PickerTab[] = [
  ...PLACED_TABS,
  { id: 'more', label: 'More', rows: toMoreRows() },
];

function findTapKeycode(binding: Binding): string | undefined {
  if (binding.kind === 'kp' || binding.kind === 'sk' || binding.kind === 'kt') {
    return binding.key.keycode;
  }
  return binding.kind === 'mt' ? binding.tap.keycode : undefined;
}

/** The key a binding sends (by canonical name) or the same system action (FR-009, FR-016). */
export function isCurrentPickerItem(item: PickerItem, binding: Binding | undefined): boolean {
  if (binding === undefined) {
    return false;
  }
  if (item.pick.kind === 'binding') {
    return isSameBinding(item.pick.binding, binding);
  }
  const keycode = findTapKeycode(binding);
  return keycode !== undefined && keycodeByName.get(keycode)?.name === item.pick.keycode;
}

export function findPickerTabId(binding: Binding | undefined): PickerTabId | undefined {
  return PICKER_TABS.find((tab) =>
    tab.rows.some((row) => row.items.some((item) => isCurrentPickerItem(item, binding))),
  )?.id;
}
