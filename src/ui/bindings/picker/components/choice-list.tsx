import { useState } from 'react';
import { ChoiceGroupSection } from './choice-option';
import type { ChoiceListProps } from './choice-option';
import type { ChoiceGroup, PickerItem } from '@ui/bindings/picker/logic';

type VisibleGroup = {
  readonly group: ChoiceGroup;
  readonly items: readonly PickerItem[];
  /** Flat index of the group's first visible option. */
  readonly start: number;
};

function toVisibleGroups(groups: readonly ChoiceGroup[]): readonly VisibleGroup[] {
  const visible: VisibleGroup[] = [];
  let start = 0;
  for (const group of groups) {
    visible.push({ group, items: group.items, start });
    start += group.items.length;
  }
  return visible;
}

// One scrolling list with sticky headings and a single roving tab stop (spec 006 FR-006/FR-012).
export function ChoiceList(props: ChoiceListProps) {
  const { id, groups } = props;
  return (
    <div className="relative max-h-80 overflow-auto overscroll-contain pr-1" data-choice-list={id}>
      <ChoiceGroups {...props} visibleGroups={toVisibleGroups(groups)} />
    </div>
  );
}

function ChoiceGroups(
  props: ChoiceListProps & { readonly visibleGroups: readonly VisibleGroup[] },
) {
  const { visibleGroups, currentId } = props;
  const items = visibleGroups.flatMap((visible) => visible.items);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      items.findIndex((item) => item.id === currentId),
      0,
    ),
  );

  function handleActivate(index: number) {
    setActiveIndex(index);
  }

  return visibleGroups.map((visible) => (
    <ChoiceGroupSection
      {...props}
      group={visible.group}
      itemCount={items.length}
      items={visible.items}
      key={visible.group.id}
      onActivate={handleActivate}
      start={visible.start}
      tabStopIndex={Math.min(activeIndex, items.length - 1)}
    />
  ));
}
