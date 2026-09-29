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

/** Full action name: keycap aria-label, tooltip, Bindings table, status messages (FR-007). */
export function formatBindingName(binding: Binding | undefined): string {
  if (binding === undefined) {
    return 'Not assigned (does nothing)';
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
    // New kinds read their catalog label until their story names their params (spec 005).
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader':
    case 'tap_dance':
    case 'mod_morph': {
      const { kind } = binding;
      return BEHAVIORS.find((behavior) => behavior.id === kind)?.label ?? kind;
    }
    default: {
      return assertNever(binding);
    }
  }
}
