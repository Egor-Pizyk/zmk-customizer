import { assertNever } from '@domain';
import type { Binding, Project } from '@domain';
import { renderKeyStroke } from './render-key-stroke';

type BindingInput = {
  readonly project: Project;
  readonly findCustomLabel: (binding: CustomBinding) => string;
};

type CustomBinding = Extract<Binding, { readonly kind: 'tap_dance' | 'mod_morph' }>;

export function renderBinding(binding: Binding, input: BindingInput): string {
  switch (binding.kind) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return `&${binding.kind} ${renderKeyStroke(binding.key)}`;
    }
    case 'mt': {
      return `&mt ${renderKeyStroke(binding.hold)} ${renderKeyStroke(binding.tap)}`;
    }
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl': {
      return `&${binding.kind} ${input.project.layers.findIndex((layer) => layer.id === binding.layerId)}`;
    }
    case 'lt': {
      return `&lt ${input.project.layers.findIndex((layer) => layer.id === binding.layerId)} ${renderKeyStroke(binding.tap)}`;
    }
    case 'tap_dance':
    case 'mod_morph': {
      return `&${input.findCustomLabel(binding)}`;
    }
    case 'bt':
    case 'out':
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return renderFixedBinding(binding);
    }
    default: {
      return assertNever(binding);
    }
  }
}

function renderFixedBinding(
  binding: Extract<
    Binding,
    {
      readonly kind:
        | 'bt'
        | 'out'
        | 'trans'
        | 'none'
        | 'caps_word'
        | 'key_repeat'
        | 'gresc'
        | 'sys_reset'
        | 'bootloader';
    }
  >,
): string {
  switch (binding.kind) {
    // No-profile BT macros already expand to command and dummy profile.
    case 'bt': {
      return 'profile' in binding
        ? `&bt ${binding.command} ${binding.profile}`
        : `&bt ${binding.command}`;
    }
    case 'out': {
      return `&out ${binding.command}`;
    }
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return `&${binding.kind}`;
    }
    default: {
      return assertNever(binding);
    }
  }
}
