import { BEHAVIORS } from '../../catalog/behaviors';
import { BLUETOOTH_COMMANDS, BLUETOOTH_PROFILE_COUNT } from '../../catalog/bluetooth-commands';
import { KEYCODES, MODIFIER_KEYCODES } from '../../catalog/keycodes';
import type { KeycodeCategory } from '../../catalog/parse-keys-header';
import { OUTPUT_COMMANDS } from '../../catalog/output-commands';
import { assertNever } from '../../domain/assert-never';
import type { Layer } from '../../domain/types';
import type { SlotRef } from './binding-slots';
import {
  toBehaviorItem,
  toBluetoothCommandItem,
  toKeycodeItem,
  toLayerItem,
  toOutputCommandItem,
  toProfileItem,
} from './to-picker-item';
import type { PickerItem } from './to-picker-item';

export type ChoiceGroup = {
  readonly id: string;
  readonly label: string;
  readonly items: readonly PickerItem[];
};

// The media keys most keymaps use; the other media and consumer codes come last (FR-006).
const COMMON_MEDIA = new Set([
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
]);

const KEY_GROUP_LABELS: readonly (readonly [KeycodeCategory, string])[] = [
  ['letters', 'Letters'],
  ['numbers', 'Numbers'],
  ['symbols', 'Symbols'],
  ['whitespace-editing', 'Editing'],
  ['navigation', 'Navigation'],
  ['modifiers', 'Modifiers'],
  ['function', 'F keys'],
  ['media-consumer', 'Media'],
  ['keypad', 'Keypad'],
  ['locks', 'Locks'],
  ['international-language', 'International'],
  ['power', 'Power'],
  ['other', 'Other'],
];

function toGroup(id: string, label: string, items: readonly PickerItem[]): ChoiceGroup {
  return { id, label, items };
}

function toKeyItems(names: readonly string[]): readonly PickerItem[] {
  return names.flatMap((name) => toKeycodeItem(name));
}

function toKeyGroups(): readonly ChoiceGroup[] {
  const groups = KEY_GROUP_LABELS.map(([category, label]) => {
    const names = KEYCODES.filter(
      (keycode) =>
        keycode.category === category &&
        (category !== 'media-consumer' || COMMON_MEDIA.has(keycode.name)),
    ).map((keycode) => keycode.name);
    return toGroup(category, label, toKeyItems(names));
  });
  const rare = KEYCODES.filter(
    (keycode) => keycode.category === 'media-consumer' && !COMMON_MEDIA.has(keycode.name),
  ).map((keycode) => keycode.name);
  return [
    ...groups.filter((group) => group.items.length > 0),
    toGroup('consumer', 'More media and consumer', toKeyItems(rare)),
  ];
}

const KEY_GROUPS = toKeyGroups();
const BEHAVIOR_GROUPS = [...new Set(BEHAVIORS.map((behavior) => behavior.group))].map((group) =>
  toGroup(
    group,
    group,
    BEHAVIORS.filter((behavior) => behavior.group === group).map((behavior) =>
      toBehaviorItem(behavior),
    ),
  ),
);
const HOLD_GROUPS = [
  toGroup('modifiers', 'Modifiers', toKeyItems(MODIFIER_KEYCODES.map((keycode) => keycode.name))),
];
const BT_COMMAND_GROUPS = [
  toGroup(
    'bt',
    'Bluetooth commands',
    BLUETOOTH_COMMANDS.map((entry) => toBluetoothCommandItem(entry)),
  ),
];
const PROFILE_GROUPS = [
  toGroup(
    'profiles',
    'Profiles',
    Array.from({ length: BLUETOOTH_PROFILE_COUNT }, (_, profile) =>
      toProfileItem(profile, BLUETOOTH_COMMANDS[0].docsUrl),
    ),
  ),
];
const OUT_COMMAND_GROUPS = [
  toGroup(
    'out',
    'Outputs',
    OUTPUT_COMMANDS.map((entry) => toOutputCommandItem(entry)),
  ),
];

/** The project's layers, and the open behavior's docs page that layer rows link to (spec 007). */
export type LayerChoiceContext = { readonly layers: readonly Layer[]; readonly docsUrl: string };

/**
 * What the open slot offers, grouped (spec 006 FR-004); module constants, stable references,
 * except the layer rows, built from the project's layers (at most 32) per render.
 */
export function getSlotChoices(slot: SlotRef, context: LayerChoiceContext): readonly ChoiceGroup[] {
  switch (slot.kind) {
    case 'behavior': {
      return BEHAVIOR_GROUPS;
    }
    case 'key':
    case 'tap':
    case 'dance-tap':
    case 'morph-side': {
      return KEY_GROUPS;
    }
    case 'hold': {
      return HOLD_GROUPS;
    }
    case 'bt-command': {
      return BT_COMMAND_GROUPS;
    }
    case 'profile': {
      return PROFILE_GROUPS;
    }
    case 'out-command': {
      return OUT_COMMAND_GROUPS;
    }
    case 'layer': {
      const { layers, docsUrl } = context;
      const items = layers.map((layer, layerIndex) => toLayerItem(layer, { layerIndex, docsUrl }));
      return [toGroup('layers', 'Layers', items)];
    }
    default: {
      return assertNever(slot);
    }
  }
}

/** The picker's title: what the open slot asks for (FR-003). */
export function formatSlotPrompt(slot: SlotRef): string {
  switch (slot.kind) {
    case 'behavior': {
      return 'What should the key do?';
    }
    case 'key': {
      return 'Which key?';
    }
    case 'hold': {
      return 'Which modifier while held?';
    }
    case 'tap': {
      return 'Which key when tapped?';
    }
    case 'bt-command': {
      return 'Which Bluetooth command?';
    }
    case 'profile': {
      return 'Which profile?';
    }
    case 'out-command': {
      return 'Where should keys go?';
    }
    case 'layer': {
      return 'Which layer?';
    }
    case 'dance-tap': {
      return `Which key for tap ${slot.index + 1}?`;
    }
    case 'morph-side': {
      return slot.side === 'normal'
        ? 'Which key normally?'
        : 'Which key while the triggers are held?';
    }
    default: {
      return assertNever(slot);
    }
  }
}
