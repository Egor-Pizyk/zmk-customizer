import { getMacroChoices } from './get-macro-choices';
import { getCustomChoices } from './get-custom-choices';
import {
  BEHAVIORS,
  BLUETOOTH_COMMANDS,
  BLUETOOTH_PROFILE_COUNT,
  KEYCODES,
  MODIFIER_KEYCODES,
  OUTPUT_COMMANDS,
} from '@catalog/bindings';
import type { KeycodeCategory } from '@catalog/bindings';
import { assertNever } from '@domain';
import type { CustomBehavior, Layer, Macro } from '@domain';
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
export type LayerChoiceContext = {
  readonly layers: readonly Layer[];
  readonly docsUrl: string;
  readonly behaviors?: readonly CustomBehavior[];
  readonly macros?: readonly Macro[];
};

/**
 * What the open slot offers, grouped (spec 006 FR-004); module constants, stable references,
 * except the layer rows, built from the project's layers (at most 32) per render.
 */
export function getSlotChoices(slot: SlotRef, context: LayerChoiceContext): readonly ChoiceGroup[] {
  if (slot.kind === 'custom-parameter') {
    return getParameterChoices(slot, context);
  }
  switch (slot.kind) {
    case 'behavior': {
      return [
        ...BEHAVIOR_GROUPS,
        ...getCustomChoices(context.behaviors ?? []),
        ...getMacroChoices(context.macros ?? []),
      ];
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
export { formatSlotPrompt } from './format-slot-prompt';

function getParameterChoices(
  slot: Extract<SlotRef, { kind: 'custom-parameter' }>,
  context: LayerChoiceContext,
): readonly ChoiceGroup[] {
  if (slot.parameterKind === 'key') {
    return KEY_GROUPS;
  }
  return [
    toGroup(
      'layers',
      'Layers',
      context.layers.map((layer, layerIndex) =>
        toLayerItem(layer, { layerIndex, docsUrl: context.docsUrl }),
      ),
    ),
  ];
}
