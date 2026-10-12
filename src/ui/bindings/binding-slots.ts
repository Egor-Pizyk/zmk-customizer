import { BEHAVIORS } from '../../catalog/behaviors';
import type { BehaviorEntry } from '../../catalog/behaviors';
import { keycodeByName } from '../../catalog/keycodes';
import { assertNever } from '../../domain/assert-never';
import type {
  Binding,
  BluetoothCommand,
  BluetoothProfileCommand,
  KeyStroke,
  Layer,
  LayerBinding,
  OutputCommand,
} from '../../domain/types';
import { findSlotStroke } from './find-slot-stroke';

/** One part of a binding the picker edits (spec 006 FR-002). */
export type SlotRef =
  | { readonly kind: 'behavior' }
  | { readonly kind: 'key' }
  | { readonly kind: 'hold' }
  | { readonly kind: 'tap' }
  | { readonly kind: 'bt-command' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'out-command' }
  | { readonly kind: 'layer' }
  | { readonly kind: 'dance-tap'; readonly index: number }
  | { readonly kind: 'morph-side'; readonly side: 'normal' | 'morphed' };

export type DraftBehaviorId = 'kp' | 'sk' | 'kt' | 'mt' | 'bt' | 'out' | LayerBinding['kind'];

/** A chosen behavior with the values picked so far; stored only when complete (FR-009). */
export type BindingDraft = {
  readonly behaviorId: DraftBehaviorId;
  /** The key of kp/sk/kt, the tap of mt and lt. */
  readonly key?: KeyStroke;
  readonly hold?: KeyStroke;
  readonly btCommand?: BluetoothCommand | BluetoothProfileCommand;
  readonly profile?: number;
  readonly outCommand?: OutputCommand;
  readonly layerId?: string;
};

/** What the binding line shows: the stored binding, a draft, or nothing to share. */
export type LineSource =
  | { readonly kind: 'binding'; readonly binding: Binding }
  | { readonly kind: 'draft'; readonly draft: BindingDraft }
  | { readonly kind: 'none'; readonly isMixed: boolean };

export type LineSlot = {
  readonly ref: SlotRef;
  readonly label: string;
  /** As the keymap spells it (a layer: its id until named); undefined = not picked yet (draft). */
  readonly value: string | undefined;
};

export function isProfileCommand(
  command: BluetoothCommand | BluetoothProfileCommand,
): command is BluetoothProfileCommand {
  return command === 'BT_SEL' || command === 'BT_DISC';
}

/** `LC(LS(A))`: modifiers as ZMK modifier functions around the keycode. */
export function formatStrokeCode(stroke: KeyStroke): string {
  const opening = stroke.modifiers.map((modifier) => `${modifier}(`).join('');
  return `${opening}${stroke.keycode}${')'.repeat(stroke.modifiers.length)}`;
}

function toStrokeValue(stroke: KeyStroke | undefined): string | undefined {
  return stroke === undefined ? undefined : formatStrokeCode(stroke);
}

function toBluetoothSlots(
  command: BluetoothCommand | BluetoothProfileCommand | undefined,
  profile: number | undefined,
): readonly LineSlot[] {
  const commandSlot: LineSlot = { ref: { kind: 'bt-command' }, label: 'command', value: command };
  if (command === undefined || !isProfileCommand(command)) {
    return [commandSlot];
  }
  const value = profile === undefined ? undefined : String(profile);
  return [commandSlot, { ref: { kind: 'profile' }, label: 'profile', value }];
}

// The layer comes first; &lt then takes its tap (docs/zmk/behaviors.md §3.1).
function toLayerSlots(
  behaviorId: LayerBinding['kind'],
  values: { readonly layerId: string | undefined; readonly tap: string | undefined },
): readonly LineSlot[] {
  const layerSlot: LineSlot = { ref: { kind: 'layer' }, label: 'layer', value: values.layerId };
  return behaviorId === 'lt'
    ? [layerSlot, { ref: { kind: 'tap' }, label: 'tap', value: values.tap }]
    : [layerSlot];
}

// Tap-dance and mod-morph slots are the bindings of their behavior node (FR-002).
function getBehaviorNodeSlots(
  binding: Extract<Binding, { kind: 'tap_dance' | 'mod_morph' }>,
): readonly LineSlot[] {
  if (binding.kind === 'tap_dance') {
    return binding.taps.map((tap, index) => ({
      ref: { kind: 'dance-tap', index },
      label: `tap ${index + 1}`,
      value: formatStrokeCode(tap),
    }));
  }
  return (['normal', 'morphed'] as const).map((side) => ({
    ref: { kind: 'morph-side', side },
    label: side,
    value: formatStrokeCode(binding[side]),
  }));
}

function getBindingSlots(binding: Exclude<Binding, LayerBinding>): readonly LineSlot[] {
  switch (binding.kind) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return [{ ref: { kind: 'key' }, label: 'key', value: formatStrokeCode(binding.key) }];
    }
    case 'mt': {
      return [
        { ref: { kind: 'hold' }, label: 'hold', value: formatStrokeCode(binding.hold) },
        { ref: { kind: 'tap' }, label: 'tap', value: formatStrokeCode(binding.tap) },
      ];
    }
    case 'bt': {
      return toBluetoothSlots(binding.command, 'profile' in binding ? binding.profile : undefined);
    }
    case 'out': {
      return [{ ref: { kind: 'out-command' }, label: 'command', value: binding.command }];
    }
    case 'tap_dance':
    case 'mod_morph': {
      return getBehaviorNodeSlots(binding);
    }
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return [];
    }
    default: {
      return assertNever(binding);
    }
  }
}

function getDraftSlots(draft: BindingDraft): readonly LineSlot[] {
  switch (draft.behaviorId) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return [{ ref: { kind: 'key' }, label: 'key', value: toStrokeValue(draft.key) }];
    }
    case 'mt': {
      return [
        { ref: { kind: 'hold' }, label: 'hold', value: toStrokeValue(draft.hold) },
        { ref: { kind: 'tap' }, label: 'tap', value: toStrokeValue(draft.key) },
      ];
    }
    case 'bt': {
      return toBluetoothSlots(draft.btCommand, draft.profile);
    }
    case 'out': {
      return [{ ref: { kind: 'out-command' }, label: 'command', value: draft.outCommand }];
    }
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl':
    case 'lt': {
      const values = { layerId: draft.layerId, tap: toStrokeValue(draft.key) };
      return toLayerSlots(draft.behaviorId, values);
    }
    default: {
      return assertNever(draft.behaviorId);
    }
  }
}

// Layer slots hold the layer id here; getLineSlots names the layer for display.
function getSlots(source: LineSource): readonly LineSlot[] {
  if (source.kind !== 'binding') {
    return source.kind === 'draft' ? getDraftSlots(source.draft) : [];
  }
  const { binding } = source;
  if (!('layerId' in binding)) {
    return getBindingSlots(binding);
  }
  const tap = binding.kind === 'lt' ? formatStrokeCode(binding.tap) : undefined;
  return toLayerSlots(binding.kind, { layerId: binding.layerId, tap });
}

// A layer reads "1 Nav" by its current position, so moves and renames show at once; an id no
// layer has is a deleted target (spec 007 FR-011, FR-012).
function formatLayerValue(layerId: string, layers: readonly Layer[]): string {
  const layerIndex = layers.findIndex((layer) => layer.id === layerId);
  const layer = layers[layerIndex];
  return layer === undefined ? 'deleted layer' : `${layerIndex} ${layer.name}`;
}

/** The slots after the behavior tag, in ZMK parameter order (FR-001–FR-002). */
export function getLineSlots(source: LineSource, layers: readonly Layer[]): readonly LineSlot[] {
  return getSlots(source).map(({ ref, label, value }) => ({
    ref,
    label,
    value: ref.kind === 'layer' && value !== undefined ? formatLayerValue(value, layers) : value,
  }));
}

/** The behavior the line shows, stored or drafted; none when there is nothing to share. */
export function findLineBehavior(source: LineSource): BehaviorEntry | undefined {
  if (source.kind === 'none') {
    return undefined;
  }
  const behaviorId = source.kind === 'draft' ? source.draft.behaviorId : source.binding.kind;
  return BEHAVIORS.find((behavior) => behavior.id === behaviorId);
}

export function isSameSlot(first: SlotRef, second: SlotRef): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

// The open slot while the line still has it; else the first empty slot, the first slot, or the
// behavior. Undo, paste or a removed tap can take the open slot away.
export function resolveOpenSlot(source: LineSource, openSlot?: SlotRef): SlotRef {
  const slots = getSlots(source);
  if (
    openSlot?.kind === 'behavior' ||
    slots.some((slot) => openSlot !== undefined && isSameSlot(slot.ref, openSlot))
  ) {
    return openSlot ?? { kind: 'behavior' };
  }
  const slot = slots.find((candidate) => candidate.value === undefined) ?? slots[0];
  return slot?.ref ?? { kind: 'behavior' };
}

/** The id of the open slot's current choice, to mark and scroll to (spec 006 FR-005, FR-006). */
export function findSlotValueId(source: LineSource, slot: SlotRef): string | undefined {
  switch (slot.kind) {
    case 'behavior': {
      if (source.kind === 'none') {
        return undefined;
      }
      return source.kind === 'draft' ? source.draft.behaviorId : source.binding.kind;
    }
    case 'bt-command':
    case 'profile':
    case 'out-command':
    case 'layer': {
      return getSlots(source).find((line) => line.ref.kind === slot.kind)?.value;
    }
    case 'key':
    case 'hold':
    case 'tap':
    case 'dance-tap':
    case 'morph-side': {
      const keycode = findSlotStroke(source, slot)?.keycode;
      return keycode === undefined ? undefined : (keycodeByName.get(keycode)?.name ?? keycode);
    }
    default: {
      return assertNever(slot);
    }
  }
}

/**
 * What the modifier chips of the open slot change: the stored stroke, the chips held for a
 * drafted key, or nothing (hold, sticky and toggle keys take no modifiers here) (FR-010). The tap
 * of layer-tap takes them like the tap of mod-tap (spec 007).
 */
export function findModifierTarget(
  source: LineSource,
  slot: SlotRef,
): KeyStroke | 'pending' | undefined {
  const canHaveModifiers =
    slot.kind === 'tap' ||
    slot.kind === 'dance-tap' ||
    slot.kind === 'morph-side' ||
    slot.kind === 'key';
  if (!canHaveModifiers) {
    return undefined;
  }
  if (source.kind === 'draft') {
    const { behaviorId } = source.draft;
    return behaviorId === 'kp' || behaviorId === 'mt' || behaviorId === 'lt'
      ? 'pending'
      : undefined;
  }
  if (source.kind === 'binding' && (source.binding.kind === 'sk' || source.binding.kind === 'kt')) {
    return undefined;
  }
  return findSlotStroke(source, slot);
}
