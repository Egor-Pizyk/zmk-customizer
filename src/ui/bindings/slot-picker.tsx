import { useId } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { INPUT_CLASSES } from '../components/input-classes';
import { findLineBehavior, findSlotValueId } from './binding-slots';
import { ChoiceList } from './choice-list';
import { filterPickerItems } from './filter-picker-items';
import { formatSlotPrompt, getSlotChoices } from './slot-choices';
import type { ChoiceGroup } from './slot-choices';
import type { PickerItem } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

type SlotPickerProps = {
  readonly picker: KeyPickerState;
  readonly onPick: (item: PickerItem) => void;
  /** Escape in the search field: back to the active keycap (spec 004 FR-025). */
  readonly onEscapeToCanvas: () => void;
};

function filterGroups(groups: readonly ChoiceGroup[], search: string): readonly ChoiceGroup[] {
  return groups.flatMap((group) => {
    const items = filterPickerItems(group.items, search);
    return items.length === 0 ? [] : [{ ...group, items }];
  });
}

function SlotSearch({
  picker,
  listId,
  firstResult,
  onPick: handlePick,
  onEscapeToCanvas,
}: SlotPickerProps & { readonly listId: string; readonly firstResult: PickerItem | undefined }) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    picker.handleSearchChange(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && firstResult !== undefined && picker.search.trim() !== '') {
      event.preventDefault();
      handlePick(firstResult);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      document
        .querySelector<HTMLButtonElement>(`[data-choice-list="${listId}"] [tabindex="0"]`)
        ?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onEscapeToCanvas();
    }
  }

  return (
    <input
      aria-label="Search by name, code or symbol"
      className={INPUT_CLASSES}
      data-panel-focus
      data-slot-search={listId}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Search by name, code or symbol"
      type="search"
      value={picker.search}
    />
  );
}

// The open slot's question, search and choices (spec 006 FR-003, FR-006, FR-007).
export function SlotPicker(props: SlotPickerProps) {
  const { picker } = props;
  const promptId = useId();
  const listId = useId();
  // Layer rows link to the open behavior's docs; a layer slot exists only on its line.
  const docsUrl = findLineBehavior(picker.source)?.docsUrl ?? '';
  const choices = getSlotChoices(picker.slot, { layers: picker.layers, docsUrl });
  const groups = filterGroups(choices, picker.search);

  function handleExitTop() {
    document.querySelector<HTMLInputElement>(`[data-slot-search="${listId}"]`)?.focus();
  }

  return (
    <section aria-labelledby={promptId} className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm font-semibold" id={promptId}>
        {formatSlotPrompt(picker.slot)}
      </h3>
      <SlotSearch {...props} firstResult={groups[0]?.items[0]} listId={listId} />
      {groups.length === 0 ? (
        <p className="text-text-muted">{`Nothing matches “${picker.search.trim()}”.`}</p>
      ) : (
        <ChoiceList
          currentId={findSlotValueId(picker.source, picker.slot)}
          groups={groups}
          id={listId}
          isSearching={picker.search.trim() !== ''}
          key={JSON.stringify(picker.slot)}
          onExitTop={handleExitTop}
          onPick={props.onPick}
        />
      )}
    </section>
  );
}
