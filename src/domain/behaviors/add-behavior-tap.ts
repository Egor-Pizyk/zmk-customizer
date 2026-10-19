import type { CustomBehavior } from '@domain';

export function addBehaviorTap(
  behavior: Extract<CustomBehavior, { kind: 'tap-dance' }>,
): CustomBehavior {
  if (behavior.bindings.length >= 32) {
    return behavior;
  }
  let next = 0;
  for (const action of behavior.bindings) {
    next = Math.max(next, Number(action.id.slice(1)) + 1);
  }
  return {
    ...behavior,
    bindings: [
      ...behavior.bindings,
      { id: `a${next}`, binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
    ],
  };
}
