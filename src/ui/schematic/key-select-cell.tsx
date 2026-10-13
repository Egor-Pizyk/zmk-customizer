import type { KeyboardEvent, ChangeEvent } from 'react';
import { getSelectedKeyIds } from './get-selected-key-ids';
import type { PartsTableProps } from './parts-list';

type KeySelectCellProps = PartsTableProps & {
  readonly keyId: string;
  readonly keyIndex: number;
  readonly activeKeyId: string | undefined;
  readonly onActiveKeyChange: (keyId: string) => void;
};

export function KeySelectCell(props: KeySelectCellProps) {
  const { keyId, keyIndex, project } = props;
  const selectedKeyIds = getSelectedKeyIds(props.selection);
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const keyIds = event.target.checked
      ? [...selectedKeyIds, keyId]
      : selectedKeyIds.filter((id) => id !== keyId);
    props.onSelectionChange({ kind: 'multi', keyIds, wireIds: [] });
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    const next = step === undefined ? undefined : project.keys[keyIndex + step];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    props.onActiveKeyChange(next.id);
    if (event.shiftKey) {
      props.onSelectionChange({
        kind: 'multi',
        keyIds: [...new Set([...selectedKeyIds, keyId, next.id])],
        wireIds: [],
      });
    }
    document.querySelector<HTMLInputElement>(`[data-schematic-select-key="${next.id}"]`)?.focus();
  }
  return (
    <SelectionInput
      {...props}
      isSelected={selectedKeyIds.includes(keyId)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}

function SelectionInput(
  props: KeySelectCellProps & {
    readonly isSelected: boolean;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  },
) {
  const { keyId, keyIndex, project } = props;
  const activeKeyId = project.keys.some((key) => key.id === props.activeKeyId)
    ? props.activeKeyId
    : project.keys[0]?.id;
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    props.onChange(event);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    props.onKeyDown(event);
  }
  return (
    <td>
      <input
        aria-label={`Select key ${keyIndex}`}
        checked={props.isSelected}
        className="size-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        data-schematic-select-key={keyId}
        onChange={handleChange}
        onFocus={() => {
          props.onActiveKeyChange(keyId);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={keyId === activeKeyId ? 0 : -1}
        type="checkbox"
      />
    </td>
  );
}
