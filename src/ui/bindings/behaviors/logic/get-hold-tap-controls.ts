import type { CustomBehavior, HoldTapTarget, HoldTapFlavor } from '@domain';
import { HOLD_TAP_TARGETS, HOLD_TAP_FLAVORS } from '@catalog/bindings';

type Held = Extract<CustomBehavior, { kind: 'hold-tap' }>;
export function getHoldTapControls(behavior: Held, onChange: (value: CustomBehavior) => void) {
  const targets = (['holdBehavior', 'tapBehavior'] as const).map((property) => ({
    property,
    value: behavior[property],
    choices: HOLD_TAP_TARGETS,
    onCommit: (value: HoldTapTarget) => {
      onChange({ ...behavior, [property]: value });
    },
  }));
  const flavor = {
    property: 'flavor' as const,
    value: behavior.flavor,
    choices: HOLD_TAP_FLAVORS,
    onCommit: (value: HoldTapFlavor) => {
      onChange({ ...behavior, flavor: value });
    },
  };
  const numbers = (['tappingTermMs', 'quickTapMs', 'requirePriorIdleMs'] as const).map(
    (property) => ({
      property,
      value: behavior[property],
      onCommit: (value: number) => {
        onChange({ ...behavior, [property]: value });
      },
    }),
  );
  const flags = (
    ['retroTap', 'holdWhileUndecided', 'holdWhileUndecidedLinger', 'holdTriggerOnRelease'] as const
  ).map((property) => ({
    property,
    value: behavior[property],
    onCommit: (value: boolean) => {
      onChange({ ...behavior, [property]: value });
    },
  }));
  return { targets, flavor, numbers, flags };
}
