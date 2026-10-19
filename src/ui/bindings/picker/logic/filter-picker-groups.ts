import { filterPickerItems } from './filter-picker-items';
import type { ChoiceGroup } from './slot-choices';

export function filterPickerGroups(
  groups: readonly ChoiceGroup[],
  search: string,
): readonly ChoiceGroup[] {
  return groups.flatMap((group) => {
    const items = filterPickerItems(group.items, search, { category: group.label });
    return items.length === 0 ? [] : [{ ...group, items }];
  });
}
