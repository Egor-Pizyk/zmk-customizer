import type { KeyboardEvent } from 'react';
import { PICKER_TABS } from './picker-tabs';
import type { PickerTab, PickerTabId } from './picker-tabs';

type PickerTabBarProps = {
  readonly tabId: PickerTabId;
  readonly panelId: string;
  readonly onTabChange: (tabId: PickerTabId) => void;
};

const STEP_BY_KEY: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

function findNextTab(key: string, index: number): PickerTab | undefined {
  const count = PICKER_TABS.length;
  if (key === 'Home') {
    return PICKER_TABS[0];
  }
  if (key === 'End') {
    return PICKER_TABS[count - 1];
  }
  const step = STEP_BY_KEY[key];
  return step === undefined ? undefined : PICKER_TABS[(index + step + count) % count];
}

// Tabs with a roving tabindex and automatic activation (admin-ui.md "Tabs").
export function PickerTabBar(props: PickerTabBarProps) {
  return (
    <div
      aria-label="Key groups"
      className="flex flex-wrap gap-0.5 border-b border-border pb-1"
      role="tablist"
    >
      {PICKER_TABS.map((tab, index) => (
        <PickerTabButton {...props} index={index} key={tab.id} tab={tab} />
      ))}
    </div>
  );
}

function PickerTabButton(
  props: PickerTabBarProps & { readonly tab: PickerTab; readonly index: number },
) {
  const { tab, index, tabId, panelId, onTabChange } = props;
  const isSelected = tab.id === tabId;

  function handleClick() {
    onTabChange(tab.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = findNextTab(event.key, index);
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    onTabChange(next.id);
    document.querySelector<HTMLButtonElement>(`[data-picker-tab="${next.id}"]`)?.focus();
  }

  return (
    <button
      aria-controls={panelId}
      aria-selected={isSelected}
      className="h-7 rounded-md px-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-selected:bg-surface-muted aria-selected:text-accent"
      data-picker-tab={tab.id}
      id={`picker-tab-${tab.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={isSelected ? 0 : -1}
      type="button"
    >
      {tab.label}
    </button>
  );
}
