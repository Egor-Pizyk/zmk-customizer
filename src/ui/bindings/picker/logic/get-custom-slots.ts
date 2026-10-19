import type { Binding } from '@domain';
import type { LineSlot } from './binding-slots';
import { formatStrokeCode } from './format-stroke-code';

export function getCustomSlots(binding: Extract<Binding, { kind: 'custom' }>): readonly LineSlot[] {
  return binding.parameters.flatMap((parameter, index) => {
    if (parameter.kind === 'dummy') {
      return [];
    }
    return [
      {
        ref: { kind: 'custom-parameter' as const, index, parameterKind: parameter.kind },
        label: `parameter ${index + 1}`,
        value: parameter.kind === 'key' ? formatStrokeCode(parameter.key) : parameter.layerId,
      },
    ];
  });
}
