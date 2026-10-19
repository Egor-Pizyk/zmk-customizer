import type { Binding, CustomBehavior } from '@domain';

export function setBehaviorTap(
  behavior: Extract<CustomBehavior, { kind: 'tap-dance' }>,
  input: { readonly actionId: string; readonly binding: Binding },
): CustomBehavior {
  return {
    ...behavior,
    bindings: behavior.bindings.map((action) =>
      action.id === input.actionId ? { ...action, binding: input.binding } : action,
    ),
  };
}
