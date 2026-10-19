import type { Binding, CustomBehavior } from '@domain';

export function getBehaviorActions(behavior: CustomBehavior): readonly Binding[] {
  if (behavior.kind === 'tap-dance') {
    return behavior.bindings.map((action) => action.binding);
  }
  if (behavior.kind === 'mod-morph') {
    return [behavior.normal, behavior.morphed];
  }
  return [];
}
