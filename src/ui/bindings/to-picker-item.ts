import { BEHAVIORS } from '../../catalog/behaviors';
import { BLUETOOTH_COMMANDS } from '../../catalog/bluetooth-commands';
import { keycodeByName } from '../../catalog/keycodes';
import { OUTPUT_COMMANDS } from '../../catalog/output-commands';
import type { Binding } from '../../domain/types';
import { formatBindingLegend, formatFullBindingLegend } from './format-binding-legend';
import { formatBindingName } from './format-binding-name';
import { formatKeycapCorner } from './format-keycap-corner';
import { formatKeycodeName } from './format-keycode-name';

export type PickerPick =
  | { readonly kind: 'keycode'; readonly keycode: string }
  | { readonly kind: 'binding'; readonly binding: Binding };

/** One mini keycap of the key picker (spec 004 R14). */
export type PickerItem = {
  readonly id: string;
  readonly legend: string;
  /** The legend never shortened with "…", for hover tooltips (FR-007). */
  readonly fullLegend: string;
  /** Exact ZMK code under the symbol; hidden when it adds nothing (FR-007). */
  readonly corner: string | undefined;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description: string;
  readonly docsUrl: string;
  /** Width in key units on the Basic layout; 1 elsewhere. */
  readonly widthU: number;
  readonly pick: PickerPick;
};

export function toKeycodeItem(name: string, widthU = 1): readonly PickerItem[] {
  const keycode = keycodeByName.get(name);
  if (keycode === undefined) {
    return [];
  }
  const binding: Binding = { kind: 'kp', key: { keycode: keycode.name, modifiers: [] } };
  const legend = formatBindingLegend(binding)?.tap ?? keycode.name;
  return [
    {
      id: keycode.name,
      legend,
      fullLegend: formatFullBindingLegend(binding)?.tap ?? keycode.name,
      corner: formatKeycapCorner(binding, legend),
      name: formatKeycodeName(keycode.name),
      aliases: keycode.aliases,
      description: keycode.description,
      docsUrl: keycode.docsUrl,
      widthU,
      pick: { kind: 'keycode', keycode: keycode.name },
    },
  ];
}

function findExplanation(binding: Binding): {
  readonly description: string;
  readonly docsUrl: string;
} {
  const command =
    binding.kind === 'bt'
      ? BLUETOOTH_COMMANDS.find((entry) => entry.id === binding.command)
      : OUTPUT_COMMANDS.find((entry) => binding.kind === 'out' && entry.id === binding.command);
  const behavior = BEHAVIORS.find((entry) => entry.id === binding.kind);
  return command ?? { description: behavior?.description ?? '', docsUrl: behavior?.docsUrl ?? '' };
}

export function toBindingItem(binding: Binding): PickerItem {
  const { description, docsUrl } = findExplanation(binding);
  const name = formatBindingName(binding);
  const legend = formatBindingLegend(binding)?.tap ?? name;
  return {
    id: name,
    legend,
    fullLegend: formatFullBindingLegend(binding)?.tap ?? name,
    corner: formatKeycapCorner(binding, legend),
    name,
    aliases: [],
    description,
    docsUrl,
    widthU: 1,
    pick: { kind: 'binding', binding },
  };
}
