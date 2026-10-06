import type { BehaviorEntry } from '../../catalog/behaviors';
import type { BluetoothCommandEntry } from '../../catalog/bluetooth-commands';
import { keycodeByName } from '../../catalog/keycodes';
import type { OutputCommandEntry } from '../../catalog/output-commands';
import type {
  BehaviorId,
  Binding,
  BluetoothCommand,
  BluetoothProfileCommand,
  OutputCommand,
} from '../../domain/types';
import {
  formatBindingLegend,
  formatBluetoothCommandLegend,
  formatFullBindingLegend,
} from './format-binding-legend';
import { formatKeycodeName } from './format-keycode-name';

/** The value a picker row sets in the open slot (spec 006 FR-004). */
export type PickerPick =
  | { readonly kind: 'behavior'; readonly behaviorId: BehaviorId }
  | { readonly kind: 'keycode'; readonly keycode: string }
  | { readonly kind: 'bt-command'; readonly command: BluetoothCommand | BluetoothProfileCommand }
  | { readonly kind: 'profile'; readonly profile: number }
  | { readonly kind: 'out-command'; readonly command: OutputCommand };

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

export function toKeycodeItem(name: string): readonly PickerItem[] {
  const keycode = keycodeByName.get(name);
  if (keycode === undefined) {
    return [];
  }
  const binding: Binding = { kind: 'kp', key: { keycode: keycode.name, modifiers: [] } };
  return [
    {
      id: keycode.name,
      legend: formatBindingLegend(binding)?.tap ?? keycode.name,
      fullLegend: formatFullBindingLegend(binding)?.tap ?? keycode.name,
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
  const legend = formatBindingLegend({ kind: 'out', command: entry.id })?.tap ?? entry.id;
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
