import type { Binding, CustomBehavior, Macro } from '@domain';

export type BindingDefinitions = {
  readonly behaviors?: readonly CustomBehavior[] | undefined;
  readonly macros?: readonly Macro[] | undefined;
};

export function formatReferenceName(
  binding: Extract<Binding, { kind: 'custom' | 'macro' }>,
  definitions: BindingDefinitions,
): string {
  if (binding.kind === 'macro') {
    return (
      definitions.macros?.find((entry) => entry.id === binding.macroId)?.name ??
      `Deleted macro ${binding.macroId}`
    );
  }
  return (
    definitions.behaviors?.find((entry) => entry.id === binding.behaviorId)?.name ??
    `Deleted behavior ${binding.behaviorId}`
  );
}
