import { BEHAVIORS } from '../../catalog/behaviors';
import { BLUETOOTH_COMMANDS } from '../../catalog/bluetooth-commands';
import { OUTPUT_COMMANDS } from '../../catalog/output-commands';
import { assertNever } from '../../domain/assert-never';
import type { Binding, KeyStroke } from '../../domain/types';
import { formatKeycodeName } from './format-keycode-name';
import { MODIFIER_LABELS } from './modifier-labels';

function formatKeyStroke(stroke: KeyStroke): string {
  return [
    ...stroke.modifiers.map((modifier) => MODIFIER_LABELS[modifier]),
    formatKeycodeName(stroke.keycode),
  ].join(' + ');
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function formatCommandBinding(binding: Extract<Binding, { kind: 'bt' | 'out' }>): string {
  if (binding.kind === 'out') {
    const label = OUTPUT_COMMANDS.find((command) => command.id === binding.command)?.label;
    return `Output: ${label ?? binding.command}`;
  }
  const label = BLUETOOTH_COMMANDS.find((command) => command.id === binding.command)?.label;
  const text = `Bluetooth: ${lowerFirst(label ?? binding.command)}`;
  return 'profile' in binding ? `${text} ${binding.profile}` : text;
}

function formatTapDanceName(binding: Extract<Binding, { kind: 'tap_dance' }>): string {
  const taps = binding.taps.map((tap) => formatKeyStroke(tap)).join(', then ');
  return `Tap dance ${taps} (${binding.tappingTermMs} ms)`;
}

function formatModMorphName(binding: Extract<Binding, { kind: 'mod_morph' }>): string {
  const triggers = binding.mods.map((modifier) => MODIFIER_LABELS[modifier]).join(' + ');
  const normal = formatKeyStroke(binding.normal);
  const morphed = formatKeyStroke(binding.morphed);
  return `Mod-morph ${normal} into ${morphed} with ${triggers}`;
}

/** Behaviors with no parameters to name: the catalog label (spec 004 FR-007). */
type CatalogBinding = Extract<
  Binding,
  {
    kind: 'trans' | 'none' | 'caps_word' | 'key_repeat' | 'gresc' | 'sys_reset' | 'bootloader';
  }
>;

function isCatalogBinding(binding: Binding): binding is CatalogBinding {
  switch (binding.kind) {
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return true;
    }
    case 'kp':
    case 'mt':
    case 'sk':
    case 'kt':
    case 'bt':
    case 'out':
    case 'tap_dance':
    case 'mod_morph': {
      return false;
    }
    default: {
      return assertNever(binding);
    }
  }
}

/** Full action name: keycap aria-label, tooltip, Bindings table, status messages (FR-007). */
export function formatBindingName(binding: Binding | undefined): string {
  if (binding === undefined) {
    return 'Not assigned (does nothing)';
  }
  if (isCatalogBinding(binding)) {
    return BEHAVIORS.find((behavior) => behavior.id === binding.kind)?.label ?? binding.kind;
  }
  switch (binding.kind) {
    case 'kp': {
      return formatKeyStroke(binding.key);
    }
    case 'mt': {
      return `${formatKeyStroke(binding.tap)}, ${formatKeyStroke(binding.hold)} when held`;
    }
    case 'sk': {
      return `Sticky ${formatKeyStroke(binding.key)}`;
    }
    case 'kt': {
      return `Toggle ${formatKeyStroke(binding.key)}`;
    }
    case 'bt':
    case 'out': {
      return formatCommandBinding(binding);
    }
    case 'tap_dance': {
      return formatTapDanceName(binding);
    }
    case 'mod_morph': {
      return formatModMorphName(binding);
    }
    default: {
      return assertNever(binding);
    }
  }
}
