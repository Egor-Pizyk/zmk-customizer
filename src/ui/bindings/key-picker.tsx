import type { ChangeEvent, KeyboardEvent } from 'react';
import { INPUT_CLASSES } from '../components/input-classes';
import { filterPickerItems } from './filter-picker-items';
import { MiniKeyboard } from './mini-keyboard';
import { PICKER_TABS } from './picker-tabs';
import type { PickerRow } from './picker-tabs';
import { PickerTabBar } from './picker-tab-bar';
import type { PickerItem } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

type KeyPickerProps = {
  readonly picker: KeyPickerState;
  readonly onPick: (item: PickerItem) => void;
  /** Escape in the search field: back to the active keycap (FR-025). */
  readonly onEscapeToCanvas: () => void;
};

const PANEL_ID = 'key-picker-panel';
const SEARCH_GRID_ID = 'picker-search';

function toSearchRows(search: string): readonly PickerRow[] {
  return PICKER_TABS.flatMap((tab) => {
    const items = filterPickerItems(
      tab.rows.flatMap((row) => row.items),
      search,
    );
    return items.length === 0 ? [] : [{ label: tab.label, items }];
  });
}

// One search over everything, or the open tab as a mini keyboard (spec 004 FR-009–FR-014).
export function KeyPicker(props: KeyPickerProps) {
  const { picker } = props;
  const isSearching = picker.search.trim() !== '';
  const tab = PICKER_TABS.find((candidate) => candidate.id === picker.tabId) ?? PICKER_TABS[0];
  const rows = isSearching ? toSearchRows(picker.search) : (tab?.rows ?? []);

  return (
    <div className="flex flex-col gap-2">
      <PickerSearch {...props} firstResult={rows[0]?.items[0]} />
      {isSearching ? undefined : (
        <PickerTabBar
          onTabChange={picker.handleTabChange}
          panelId={PANEL_ID}
          tabId={picker.tabId}
        />
      )}
      <PickerGrid {...props} isSearching={isSearching} label={tab?.label ?? ''} rows={rows} />
    </div>
  );
}

function PickerGrid(
  props: KeyPickerProps & {
    readonly isSearching: boolean;
    readonly label: string;
    readonly rows: readonly PickerRow[];
  },
) {
  const { picker, isSearching, label, rows, onPick: handlePick } = props;
  const current = picker.shared.kind === 'same' ? picker.shared.binding : undefined;
  return (
    <div
      aria-labelledby={isSearching ? undefined : `picker-tab-${picker.tabId}`}
      id={PANEL_ID}
      role={isSearching ? undefined : 'tabpanel'}
    >
      {rows.length === 0 ? (
        <p className="text-text-muted">{`Nothing matches “${picker.search.trim()}”.`}</p>
      ) : (
        <MiniKeyboard
          current={current}
          id={isSearching ? SEARCH_GRID_ID : `picker-${picker.tabId}`}
          isLayout={!isSearching && picker.tabId === 'basic'}
          key={isSearching ? SEARCH_GRID_ID : picker.tabId}
          label={isSearching ? 'Search results' : label}
          onDetails={picker.handleFocusItem}
          onHoverItem={picker.handleHoverItem}
          onPick={handlePick}
          rows={rows}
        />
      )}
    </div>
  );
}

function PickerSearch(props: KeyPickerProps & { readonly firstResult: PickerItem | undefined }) {
  const { picker, firstResult } = props;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    picker.handleSearchChange(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && firstResult !== undefined && picker.search.trim() !== '') {
      event.preventDefault();
      props.onPick(firstResult);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      document.querySelector<HTMLButtonElement>(`#${PANEL_ID} button[tabindex="0"]`)?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      props.onEscapeToCanvas();
    }
  }

  return (
    <input
      aria-label="Search keys and actions"
      className={INPUT_CLASSES}
      data-panel-focus
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Search keys, Bluetooth, reset…"
      type="search"
      value={picker.search}
    />
  );
}
