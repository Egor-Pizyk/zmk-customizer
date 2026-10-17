import type { KeyboardEvent } from 'react';
import { toTabId, useTabVisibility } from '@ui/components/logic';

export type TabItem = {
  /** Stable id of the entity the tab shows, unique among the items. */
  readonly id: string;
  readonly label: string;
  /** Small muted text after the label, part of the tab's name. */
  readonly detail?: string;
  /** Joined issue path; the problems panel focuses `[data-issue-path]`. */
  readonly issuePath?: string;
};

type TabsProps = {
  readonly label: string;
  readonly items: readonly TabItem[];
  readonly selectedIndex: number;
  /** Prefix of the tab element ids; `toTabId` gives a tab's id for `aria-labelledby`. */
  readonly idPrefix: string;
  readonly panelId: string;
  readonly onSelect: (index: number) => void;
};

function findTargetIndex(key: string, input: { readonly index: number; readonly count: number }) {
  const { index, count } = input;
  const targetByKey: Readonly<Record<string, number>> = {
    ArrowLeft: (index - 1 + count) % count,
    ArrowRight: (index + 1) % count,
    Home: 0,
    End: count - 1,
  };
  return targetByKey[key];
}

// One tab stop with a roving tabindex; arrows, Home and End move between tabs, and focus selects
// (automatic activation, also when the problems panel focuses a tab) (admin-ui.md "Tabs").
export function Tabs({
  label,
  items,
  selectedIndex,
  idPrefix,
  panelId,
  onSelect: handleSelect,
}: TabsProps) {
  const listRef = useTabVisibility({ items, selectedIndex });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const targetIndex = findTargetIndex(event.key, { index, count: items.length });
    const target = targetIndex === undefined ? undefined : items[targetIndex];
    if (target === undefined) {
      return;
    }
    event.preventDefault();
    document.querySelector<HTMLElement>(`[id="${toTabId(idPrefix, target.id)}"]`)?.focus();
  }

  return (
    <div
      aria-label={label}
      className="flex h-14 min-w-0 flex-1 gap-1 overflow-x-auto p-1"
      ref={listRef}
      role="tablist"
    >
      {items.map((item, index) => (
        <Tab
          id={toTabId(idPrefix, item.id)}
          index={index}
          isSelected={index === selectedIndex}
          item={item}
          key={item.id}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          panelId={panelId}
        />
      ))}
    </div>
  );
}

type TabProps = {
  readonly id: string;
  readonly item: TabItem;
  readonly index: number;
  readonly isSelected: boolean;
  readonly panelId: string;
  readonly onSelect: (index: number) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
};

function Tab({ id, item, index, isSelected, panelId, onSelect, onKeyDown }: TabProps) {
  function handleSelect() {
    if (!isSelected) {
      onSelect(index);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown(event, index);
  }

  return (
    <button
      aria-controls={panelId}
      aria-selected={isSelected}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border-b-2 border-transparent px-3 text-sm whitespace-nowrap text-text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-selected:border-accent aria-selected:font-semibold aria-selected:text-text motion-safe:transition-colors"
      data-issue-path={item.issuePath}
      id={id}
      onClick={handleSelect}
      onFocus={handleSelect}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={isSelected ? 0 : -1}
      title={item.label}
      type="button"
    >
      <span className="max-w-48 truncate">{item.label}</span>
      {item.detail === undefined ? undefined : (
        <span className="text-xs font-normal text-text-muted">{item.detail}</span>
      )}
    </button>
  );
}
