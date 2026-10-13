import type { KeyboardEvent } from 'react';
import { DocsLink } from '@ui/components';
import { formatLegendTitle } from '../formatting/format-legend-title';
import type { ChoiceGroup } from './slot-choices';
import type { PickerItem } from './to-picker-item';

function findNextIndex(
  key: string,
  { index, count }: { readonly index: number; readonly count: number },
): number | undefined {
  const nextByKey: Readonly<Record<string, number>> = {
    ArrowDown: Math.min(index + 1, count - 1),
    ArrowUp: index - 1,
    Home: 0,
    End: count - 1,
  };
  return nextByKey[key];
}

function focusOption(listId: string, index: number) {
  document.querySelector<HTMLButtonElement>(`[data-choice="${listId}:${index}"]`)?.focus();
}

// Opens centred on the current value; a stable function, so React calls it once per row mount.
function scrollIntoList(element: HTMLElement | null) {
  const list = element?.closest<HTMLElement>('[data-choice-list]');
  if (element && list) {
    list.scrollTop = element.offsetTop - list.clientHeight / 2;
  }
}

function handleDocsKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    event.currentTarget.parentElement?.querySelector('button')?.focus();
  }
}

export type ChoiceListProps = {
  /** Unique per slot; option ids derive from it. */
  readonly id: string;
  readonly groups: readonly ChoiceGroup[];
  readonly currentId: string | undefined;
  readonly isSearching: boolean;
  readonly onPick: (item: PickerItem) => void;
  /** ArrowUp on the first option: back to the search field. */
  readonly onExitTop: () => void;
};

export type GroupSectionProps = ChoiceListProps & {
  readonly group: ChoiceGroup;
  readonly items: readonly PickerItem[];
  /** Flat index of the group's first visible option. */
  readonly start: number;
  readonly tabStopIndex: number;
  readonly itemCount: number;
  readonly onActivate: (index: number) => void;
};

// A sticky header over the group's rows (FR-006).
export function ChoiceGroupSection(props: GroupSectionProps) {
  const { group, items, start } = props;
  return (
    <section data-group={group.id}>
      <h4 className="sticky top-0 z-10 flex justify-between border-b border-border bg-surface-raised py-1.5 text-sm font-semibold text-text">
        <span>{group.label}</span>
        <span className="text-xs font-normal text-text-muted tabular-nums">
          {group.items.length}
        </span>
      </h4>
      <ul className="flex flex-col py-1">
        {items.map((item, offset) => (
          <ChoiceOption {...props} index={start + offset} item={item} key={item.id} />
        ))}
      </ul>
    </section>
  );
}

type ChoiceOptionProps = GroupSectionProps & {
  readonly item: PickerItem;
  readonly index: number;
};

function ChoiceOption(props: ChoiceOptionProps) {
  const { id, item, index, currentId, isSearching } = props;
  const isCurrent = item.id === currentId;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.currentTarget.parentElement?.querySelector('a')?.focus();
      return;
    }
    const next = findNextIndex(event.key, { index, count: props.itemCount });
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    if (next < 0) {
      props.onExitTop();
      return;
    }
    props.onActivate(next);
    focusOption(id, next);
  }

  return (
    <li
      className="flex items-center gap-2 rounded-md px-1 py-0.5 data-current:bg-surface-muted"
      data-current={isCurrent || undefined}
      ref={isCurrent && !isSearching ? scrollIntoList : undefined}
    >
      <ChoiceButton {...props} isCurrent={isCurrent} onKeyDown={handleKeyDown} />
      <DocsLink href={item.docsUrl} onKeyDown={handleDocsKeyDown} tabIndex={-1} topic={item.name} />
    </li>
  );
}

function ChoiceButton(
  props: ChoiceOptionProps & {
    readonly isCurrent: boolean;
    readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  },
) {
  const { id, item, index, isCurrent } = props;
  const describedBy = `${id}-${index}-description`;

  function handleClick() {
    props.onPick(item);
  }

  function handleFocus() {
    props.onActivate(index);
  }

  return (
    <button
      aria-describedby={describedBy}
      aria-label={isCurrent ? `${item.name}, current` : item.name}
      aria-pressed={isCurrent}
      className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-xs text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
      data-choice={`${id}:${index}`}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={props.onKeyDown}
      tabIndex={index === props.tabStopIndex ? 0 : -1}
      title={formatLegendTitle(item.fullLegend, item.name)}
      type="button"
    >
      <ChoiceText describedBy={describedBy} isCurrent={isCurrent} item={item} />
    </button>
  );
}

// Name, description (with the codes for screen readers) and the visible codes.
function ChoiceText({
  item,
  isCurrent,
  describedBy,
}: {
  readonly item: PickerItem;
  readonly isCurrent: boolean;
  readonly describedBy: string;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">
          {item.name}
          {isCurrent ? <span className="ml-1 text-accent">✓ current</span> : undefined}
        </span>
        <span className="truncate text-text-muted" id={describedBy}>
          {item.description}
          {item.codes.length === 0 ? undefined : (
            <span className="sr-only">{`. ZMK code ${item.codes.join(', ')}`}</span>
          )}
        </span>
      </span>
      <ChoiceCodes codes={item.codes} />
    </>
  );
}

// The canonical code and its first alias; every alias still matches the search (FR-007).
const VISIBLE_CODE_COUNT = 2;

function ChoiceCodes({ codes }: { readonly codes: readonly string[] }) {
  return (
    <span aria-hidden="true" className="flex max-w-36 shrink-0 flex-wrap justify-end gap-0.5">
      {codes.slice(0, VISIBLE_CODE_COUNT).map((code, codeIndex) => (
        <code
          className="rounded-sm border border-border px-1 font-mono text-xs data-alias:text-text-muted"
          data-alias={codeIndex > 0 || undefined}
          key={code}
        >
          {code}
        </code>
      ))}
    </span>
  );
}
