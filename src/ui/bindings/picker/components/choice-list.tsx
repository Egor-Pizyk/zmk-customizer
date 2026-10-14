import { useState } from 'react';
import type { UIEvent } from 'react';
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

function findGroupInView(list: HTMLElement): string | undefined {
  const sections = [...list.querySelectorAll<HTMLElement>('[data-group]')];
  return sections.findLast((section) => section.offsetTop <= list.scrollTop + 4)?.dataset['group'];
}

function scrollToGroup(listId: string, groupId: string) {
  const list = document.querySelector<HTMLElement>(`[data-choice-list="${listId}"]`);
  const section = list?.querySelector<HTMLElement>(`[data-group="${groupId}"]`);
  if (list && section) {
    list.scrollTop = section.offsetTop;
  }
}

// Every group in one scrolling list under sticky headers (spec 006 FR-005, FR-006, FR-012): one tab stop
// that starts on the current value; arrows move, Enter or Space picks, ArrowRight reaches the
// row's docs link. Chips jump to a group and mark the group in view.
export function ChoiceList(props: ChoiceListProps) {
  const { id, groups } = props;
  const [groupInView, setGroupInView] = useState(groups[0]?.id);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    setGroupInView(findGroupInView(event.currentTarget) ?? groups[0]?.id);
  }

  function handleJump(groupId: string) {
    scrollToGroup(id, groupId);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {groups.length > 1 ? (
        <GroupChips groupInView={groupInView} groups={groups} onJump={handleJump} />
      ) : undefined}
      <div
        className="relative max-h-80 overflow-auto overscroll-contain pr-1"
        data-choice-list={id}
        onScroll={handleScroll}
      >
        <ChoiceGroups {...props} visibleGroups={toVisibleGroups(groups)} />
      </div>
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

function GroupChips({
  groups,
  groupInView,
  onJump,
}: {
  readonly groups: readonly ChoiceGroup[];
  readonly groupInView: string | undefined;
  readonly onJump: (groupId: string) => void;
}) {
  return (
    <nav aria-label="Jump to group" className="flex flex-wrap gap-1.5">
      {groups.map((group) => (
        <button
          aria-current={group.id === groupInView || undefined}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-current:border-accent aria-current:bg-accent aria-current:text-accent-contrast"
          key={group.id}
          onClick={() => {
            onJump(group.id);
          }}
          type="button"
        >
          {group.label}
          <span className="text-xs tabular-nums opacity-70">{group.items.length}</span>
        </button>
      ))}
    </nav>
  );
}
