import { keycodeByName } from '@catalog/bindings';
import type { BehaviorEntry, BluetoothCommandEntry, OutputCommandEntry } from '@catalog/bindings';
import { toLayerNodeName } from '@domain/layers';
import type {
  BehaviorId,
  Binding,
  BluetoothCommand,
  BluetoothProfileCommand,
  Layer,
  OutputCommand,
} from '@domain';
import {
  formatBindingLegend,
  formatFullBindingLegend,
  formatBluetoothCommandLegend,
  formatCommandLegend,
  formatKeycodeName,
} from '@ui/bindings/formatting';

/** The value a picker row sets in the open slot (spec 006 FR-004). */
export type PickerPick =
  | { readonly kind: 'macro'; readonly macroId: string }
  | { readonly kind: 'custom'; readonly behaviorId: string }
  | { readonly kind: 'behavior'; readonly behaviorId: BehaviorId }
  | { readonly kind: 'keycode'; readonly keycode: string }
  | { readonly kind: 'bt-command'; readonly command: BluetoothCommand | BluetoothProfileCommand }
  | { readonly kind: 'profile'; readonly profile: number }
  | { readonly kind: 'out-command'; readonly command: OutputCommand }
  | { readonly kind: 'layer'; readonly layerId: string };

/** One row of the slot picker (spec 006 FR-005). */
export type PickerItem = {
  /** Unique among the slot's choices. */
  readonly id: string;
  readonly legend: string;
  /** The legend never shortened with "…", for the tooltip (spec 004 FR-007). */
  readonly fullLegend: string;
  readonly name: string;
  readonly description: string;
  /** ZMK spelling to look up: the tag, command or canonical code first, then aliases. */
  readonly codes: readonly string[];
  readonly docsUrl: string;
  readonly pick: PickerPick;
};

// Key rows are no layer behaviors, so their legends need no layers.
const NO_LAYERS: readonly Layer[] = [];

export function toKeycodeItem(name: string): readonly PickerItem[] {
  const keycode = keycodeByName.get(name);
  if (keycode === undefined) {
    return [];
  }
  const binding: Binding = { kind: 'kp', key: { keycode: keycode.name, modifiers: [] } };
  return [
    {
      id: keycode.name,
      legend: formatBindingLegend(binding, NO_LAYERS)?.tap ?? keycode.name,
      fullLegend: formatFullBindingLegend(binding, NO_LAYERS)?.tap ?? keycode.name,
      name: formatKeycodeName(keycode.name),
      description: keycode.description,
      codes: [keycode.name, ...keycode.aliases],
      docsUrl: keycode.docsUrl,
      pick: { kind: 'keycode', keycode: keycode.name },
    },
  ];
}

export function toBehaviorItem(entry: BehaviorEntry): PickerItem {
  return {
    id: entry.id,
    legend: entry.tag,
    fullLegend: entry.tag,
    name: entry.label,
    description: entry.description,
    codes: [entry.tag],
    docsUrl: entry.docsUrl,
    pick: { kind: 'behavior', behaviorId: entry.id },
  };
}

export function toBluetoothCommandItem(entry: BluetoothCommandEntry): PickerItem {
  const legend = formatBluetoothCommandLegend(entry.id);
  return {
    id: entry.id,
    legend,
    fullLegend: legend,
    name: entry.label,
    description: entry.description,
    codes: [entry.id],
    docsUrl: entry.docsUrl,
    pick: { kind: 'bt-command', command: entry.id },
  };
}

export function toProfileItem(profile: number, docsUrl: string): PickerItem {
  return {
    id: String(profile),
    legend: String(profile),
    fullLegend: String(profile),
    name: `Profile ${profile}`,
    description: `Bluetooth profile ${profile}; profiles are numbered from 0.`,
    codes: [String(profile)],
    docsUrl,
    pick: { kind: 'profile', profile },
  };
}

export function toOutputCommandItem(entry: OutputCommandEntry): PickerItem {
  const legend = formatCommandLegend({ kind: 'out', command: entry.id });
  return {
    id: entry.id,
    legend,
    fullLegend: legend,
    name: entry.label,
    description: entry.description,
    codes: [entry.id],
    docsUrl: entry.docsUrl,
    pick: { kind: 'out-command', command: entry.id },
  };
}

// A layer row: position as the legend, searchable by name, position and node name (spec 007).
export function toLayerItem(
  layer: Layer,
  input: { readonly layerIndex: number; readonly docsUrl: string },
): PickerItem {
  const position = String(input.layerIndex);
  return {
    id: layer.id,
    legend: position,
    fullLegend: position,
    name: layer.name,
    description:
      input.layerIndex === 0
        ? 'Layer 0, the base layer, always on'
        : `Layer ${position} in keymap order`,
    codes: [position, toLayerNodeName(layer.name)],
    docsUrl: input.docsUrl,
    pick: { kind: 'layer', layerId: layer.id },
  };
}
