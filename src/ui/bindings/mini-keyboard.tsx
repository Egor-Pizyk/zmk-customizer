import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Binding } from '../../domain/types';
import { formatLegendTitle } from './format-legend-title';
import { moveInGrid } from './move-in-grid';
import type { GridPosition } from './move-in-grid';
import { isCurrentPickerItem } from './picker-tabs';
import type { PickerRow } from './picker-tabs';
import type { PickerItem } from './to-picker-item';

type MiniKeyboardProps = {
  /** Unique per grid; mini keycap ids derive from it. */
  readonly id: string;
  readonly label: string;
  readonly rows: readonly PickerRow[];
  /** Basic tab: keys keep their u widths so the grid looks like a keyboard. */
  readonly isLayout: boolean;
  readonly current: Binding | undefined;
  readonly onPick: (item: PickerItem) => void;
  /** Focus shows details at once; hover waits out the pointer's rest (key-picker). */
  readonly onDetails: (item: PickerItem) => void;
  readonly onHoverItem: (item: PickerItem) => void;
};

// 1u keys start from fixed widths and grow/shrink with the panel, so wider keys stay wider
// while every row fills the available width; other tabs size to their legend and wrap,
// so a long label is never cut to fit the row.
const WIDTH_CLASS_BY_U: Readonly<Record<number, string>> = {
  1: 'w-5',
  1.5: 'w-7',
  1.75: 'w-9',
  2: 'w-10',
  2.25: 'w-11',
  6.25: 'w-32',
};

function focusMiniKey(gridId: string, position: GridPosition) {
  document
    .querySelector<HTMLButtonElement>(
      `[data-mini-key="${gridId}:${position.row}:${position.index}"]`,
    )
    ?.focus();
}

// One tab stop; arrows move between mini keycaps, Enter or Space picks (spec 004 FR-010, R14).
export function MiniKeyboard(props: MiniKeyboardProps) {
  const { id, label, rows } = props;
  const [active, setActive] = useState<GridPosition>({ row: 0, index: 0 });
  const rowLengths = rows.map((row) => row.items.length);

  function handleActivate(position: GridPosition) {
    setActive(position);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, from: GridPosition) {
    const next = moveInGrid({ key: event.key, rowLengths, from });
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    setActive(next);
    focusMiniKey(id, next);
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">{label}</legend>
      {rows.map((row, rowIndex) => (
        <MiniRow
          {...props}
          active={active}
          key={row.label ?? rowIndex}
          onActivate={handleActivate}
          onMove={handleKeyDown}
          row={row}
          rowIndex={rowIndex}
        />
      ))}
    </fieldset>
  );
}

type MiniRowProps = MiniKeyboardProps & {
  readonly row: PickerRow;
  readonly rowIndex: number;
  readonly active: GridPosition;
  readonly onActivate: (position: GridPosition) => void;
  readonly onMove: (event: KeyboardEvent<HTMLButtonElement>, from: GridPosition) => void;
};

function MiniRow(props: MiniRowProps) {
  const { row, rowIndex, active } = props;
  return (
    <div className="flex flex-col gap-0.5">
      {row.label === undefined ? undefined : (
        <span className="text-xs text-text-muted">{row.label}</span>
      )}
      <div className="flex flex-wrap gap-0.5">
        {row.items.map((item, index) => (
          <MiniKey
            {...props}
            isActive={active.row === rowIndex && active.index === index}
            item={item}
            key={item.id}
            position={{ row: rowIndex, index }}
          />
        ))}
      </div>
    </div>
  );
}

type MiniKeyProps = MiniKeyboardProps & {
  readonly item: PickerItem;
  readonly position: GridPosition;
  readonly isActive: boolean;
  readonly onActivate: (position: GridPosition) => void;
  readonly onMove: (event: KeyboardEvent<HTMLButtonElement>, from: GridPosition) => void;
};

function MiniKey(props: MiniKeyProps) {
  const { id, item, position, isActive, isLayout, current } = props;
  const isCurrent = isCurrentPickerItem(item, current);
  const widthClass = isLayout
    ? `${WIDTH_CLASS_BY_U[item.widthU] ?? 'w-5'} min-w-0 shrink grow truncate`
    : 'min-w-fit grow px-1';
  // The Basic tab keeps the keyboard look; catalog tabs gain the code under the symbol.
  const corner = isLayout ? undefined : item.corner;

  function handleClick() {
    props.onPick(item);
  }

  function handleFocus() {
    props.onActivate(position);
    props.onDetails(item);
  }

  function handlePointerEnter() {
    props.onHoverItem(item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    props.onMove(event, position);
  }

  return (
    <button
      aria-label={isCurrent ? `${item.name}, current` : item.name}
      aria-pressed={isCurrent}
      className={`rounded-md border border-border-strong bg-surface-raised text-xs text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast ${widthClass} ${corner === undefined ? 'h-8 truncate' : 'flex h-auto min-h-10 flex-col items-center justify-center py-1 leading-tight'}`}
      data-mini-key={`${id}:${position.row}:${position.index}`}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      tabIndex={isActive ? 0 : -1}
      title={formatLegendTitle(item.fullLegend, item.name)}
      type="button"
    >
      <MiniKeyLabel corner={corner} legend={item.legend} />
    </button>
  );
}

function MiniKeyLabel({
  legend,
  corner,
}: {
  readonly legend: string;
  readonly corner: string | undefined;
}) {
  if (corner === undefined) {
    return legend;
  }
  return (
    <>
      <span>{legend}</span>
      <span className="text-text-muted">{corner}</span>
    </>
  );
}
