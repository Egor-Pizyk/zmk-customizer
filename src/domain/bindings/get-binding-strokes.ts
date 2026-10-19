import { assertNever } from '@domain';
import type { Binding, KeyStroke } from '@domain';

export function getBindingStrokes(binding: Binding): readonly KeyStroke[] {
  if ('key' in binding) {
    return [binding.key];
  }
  if (binding.kind === 'custom') {
    return getCustomStrokes(binding);
  }
  if ('tap' in binding) {
    return binding.kind === 'mt' ? [binding.hold, binding.tap] : [binding.tap];
  }
  switch (binding.kind) {
    case 'tap_dance': {
      return binding.taps;
    }
    case 'mod_morph': {
      return [binding.normal, binding.morphed];
    }
    case 'macro':
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'bt':
    case 'out':
    case 'sys_reset':
    case 'bootloader':
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl': {
      return [];
    }
    default: {
      return assertNever(binding);
    }
  }
}

function getCustomStrokes(binding: Extract<Binding, { kind: 'custom' }>): readonly KeyStroke[] {
  return binding.parameters.flatMap((parameter) =>
    parameter.kind === 'key' ? [parameter.key] : [],
  );
}
