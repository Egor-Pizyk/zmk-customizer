import { renderMacroReference } from './render-macro-reference';
import { renderBehaviorReference } from './render-behavior-reference';
import { assertNever } from '@domain';
import type { Binding, Project } from '@domain';
import { renderKeyStroke } from './render-key-stroke';

type BindingInput = {
  readonly project: Project;
  readonly findCustomLabel: (binding: CustomBinding) => string;
};

type CustomBinding = Extract<Binding, { readonly kind: 'tap_dance' | 'mod_morph' }>;

export function renderBinding(binding: Binding, input: BindingInput): string {
  if (binding.kind === 'macro') {
    return renderMacroReference(input.project, binding.macroId);
  }
  if (binding.kind === 'custom') {
    return renderBehaviorReference(binding, input.project);
  }
  if (binding.kind === 'tap_dance' || binding.kind === 'mod_morph') {
    return `&${input.findCustomLabel(binding)}`;
  }
  if ('layerId' in binding) {
    return renderLayerBinding(binding, input.project);
  }
  switch (binding.kind) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return `&${binding.kind} ${renderKeyStroke(binding.key)}`;
    }
    case 'mt': {
      return `&mt ${renderKeyStroke(binding.hold)} ${renderKeyStroke(binding.tap)}`;
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

function renderLayerBinding(
  binding: Extract<Binding, { readonly layerId: string }>,
  project: Project,
): string {
  const layerIndex = project.layers.findIndex((layer) => layer.id === binding.layerId);
  const suffix = binding.kind === 'lt' ? ` ${renderKeyStroke(binding.tap)}` : '';
  return `&${binding.kind} ${layerIndex}${suffix}`;
}
