import type { Binding, BehaviorParameter } from '@domain';

export function setBehaviorParameter(
  binding: Extract<Binding, { kind: 'custom' }>,
  input: { readonly index: number; readonly parameter: BehaviorParameter },
): Binding {
  return {
    ...binding,
    parameters: binding.parameters.map((parameter, index) =>
      index === input.index ? input.parameter : parameter,
    ),
  };
}
