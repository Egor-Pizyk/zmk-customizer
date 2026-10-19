import { CUSTOM_BEHAVIOR_TYPES } from '@catalog/bindings';
import type { CustomBehavior } from '@domain';
import { getBehaviorLabel } from '@domain/behaviors';
import type { ChoiceGroup } from './slot-choices';
import type { PickerItem } from './to-picker-item';

export function getCustomChoices(behaviors: readonly CustomBehavior[]): readonly ChoiceGroup[] {
  const items: PickerItem[] = behaviors.map((behavior) => {
    const entry = CUSTOM_BEHAVIOR_TYPES.find((item) => item.kind === behavior.kind);
    const label = getBehaviorLabel(behavior);
    return {
      id: behavior.id,
      legend: `&${label}`,
      fullLegend: `&${label}`,
      name: behavior.name,
      description: entry?.description ?? '',
      codes: [label],
      docsUrl: entry?.docsUrl ?? '',
      pick: { kind: 'custom', behaviorId: behavior.id },
    };
  });
  return items.length === 0 ? [] : [{ id: 'custom', label: 'Named behaviors', items }];
}
