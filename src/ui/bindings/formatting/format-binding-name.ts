import { formatReferenceName } from './format-reference-name';
import type { BindingDefinitions } from './format-reference-name';
import { BEHAVIORS, BLUETOOTH_COMMANDS, OUTPUT_COMMANDS } from '@catalog/bindings';
import { assertNever } from '@domain';
import type { Binding, KeyStroke, Layer, LayerBinding } from '@domain';
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
    case 'macro':
    case 'custom':
    case 'kp':
    case 'mt':
    case 'sk':
    case 'kt':
    case 'bt':
    case 'out':
    case 'tap_dance':
    case 'mod_morph':
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl':
    case 'lt': {
      return false;
    }
    default: {
      return assertNever(binding);
    }
  }
}

function findBehaviorLabel(binding: Binding): string {
  return BEHAVIORS.find((behavior) => behavior.id === binding.kind)?.label ?? binding.kind;
}

// "Momentary layer Nav"; layer-tap follows the mod-tap pattern (spec 007 contracts/ui.md).
function formatLayerBindingName(binding: LayerBinding, layers: readonly Layer[]): string {
  const name = layers.find((layer) => layer.id === binding.layerId)?.name;
  if (binding.kind === 'lt') {
    const held = name === undefined ? 'deleted layer' : `layer ${name}`;
    return `${formatKeyStroke(binding.tap)}, ${held} when held`;
  }
  return `${findBehaviorLabel(binding)} ${name ?? '(deleted layer)'}`;
}

/** Full action name: keycap aria-label, tooltip, Bindings table, status messages (FR-007). */
export function formatBindingName(
  binding: Binding | undefined,
  layers: readonly Layer[],
  definitions: BindingDefinitions = {},
): string {
  if (binding === undefined) {
    return 'Not assigned (does nothing)';
  }
  if (binding.kind === 'macro' || binding.kind === 'custom') {
    return formatReferenceName(binding, definitions);
  }
  if (isCatalogBinding(binding)) {
    return findBehaviorLabel(binding);
  }
  if ('layerId' in binding) {
    return formatLayerBindingName(binding, layers);
  }
  return formatParameterName(binding);
}

function formatParameterName(
  binding: Exclude<Binding, CatalogBinding | LayerBinding | { kind: 'custom' | 'macro' }>,
): string {
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
