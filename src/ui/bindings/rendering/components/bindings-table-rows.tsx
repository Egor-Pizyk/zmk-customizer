import type { Project } from '@domain';
import { Button } from '@ui/components/components';
import { WarningIcon } from '@ui/components/icons';
import { formatBindingName, formatSelectionName } from '@ui/bindings/formatting';
import type { ChangeEvent, KeyboardEvent } from 'react';

export type BindingsTableRowsProps = {
  readonly project: Project;
  /** The open layer (spec 007 FR-007). */
  readonly layerIndex: number;
  readonly selectedKeyIds: readonly string[];
  readonly activeKeyId: string | undefined;
  readonly problemsByKeyId: ReadonlyMap<string, readonly string[]>;
  readonly onSelectionChange: (keyIds: readonly string[]) => void;
  readonly onActiveKeyChange: (keyId: string) => void;
  readonly onKeycapSize: (keyId: string) => void;
  readonly onChooseAction: (keyId: string) => void;
};

const STEP_BY_KEY: Readonly<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };

function focusCheckbox(keyId: string) {
  document.querySelector<HTMLInputElement>(`[data-select-key-id="${keyId}"]`)?.focus();
}

// Selection column: one tab stop with a roving tabindex; Space toggles natively, arrows move,
// Shift+arrows extend (admin-ui.md "Tables").
export function BindingsTableRows(props: BindingsTableRowsProps) {
  const { project, selectedKeyIds, activeKeyId, problemsByKeyId } = props;
  const rovingKeyId = activeKeyId ?? project.keys[0]?.id;
  return project.keys.map((key, keyIndex) => {
    const isSelected = selectedKeyIds.includes(key.id);
    const problems = problemsByKeyId.get(key.id) ?? [];
    return (
      <tr
        className="h-8 border-t border-border data-selected:bg-surface-muted"
        data-selected={isSelected || undefined}
        key={key.id}
      >
        <td>
          <SelectCell
            {...props}
            isRoving={key.id === rovingKeyId}
            isSelected={isSelected}
            keyId={key.id}
            keyIndex={keyIndex}
          />
        </td>
        <RowHeader {...props} keyId={key.id} keyIndex={keyIndex} />
        <td>
          <span>{formatRowBinding(props, key.id)}</span>
          {problems.map((problem) => (
            <span className="flex items-center gap-1 text-xs text-danger" key={problem}>
              <WarningIcon />
              {problem}
            </span>
          ))}
        </td>
        <td>
          <ChooseButton {...props} keyId={key.id} keyIndex={keyIndex} />
          <SizeButton {...props} keyId={key.id} keyIndex={keyIndex} />
        </td>
      </tr>
    );
  });
}

type RowProps = BindingsTableRowsProps & { readonly keyId: string; readonly keyIndex: number };

function SelectCell(
  props: RowProps & { readonly isRoving: boolean; readonly isSelected: boolean },
) {
  const { project, selectedKeyIds, keyId, keyIndex, isRoving, isSelected } = props;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.checked
      ? [...selectedKeyIds, keyId]
      : selectedKeyIds.filter((id) => id !== keyId);
    props.onSelectionChange(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const step = STEP_BY_KEY[event.key];
    const nextKey = step === undefined ? undefined : project.keys[keyIndex + step];
    if (nextKey === undefined) {
      return;
    }
    event.preventDefault();
    props.onActiveKeyChange(nextKey.id);
    if (event.shiftKey) {
      props.onSelectionChange([...new Set([...selectedKeyIds, keyId, nextKey.id])]);
    }
    focusCheckbox(nextKey.id);
  }

  return (
    <input
      aria-label={`Select key ${keyIndex}`}
      checked={isSelected}
      className="size-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      data-select-key-id={keyId}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      tabIndex={isRoving ? 0 : -1}
      type="checkbox"
    />
  );
}

// Problem activation focuses this header, which selects the key (contracts/validation-issues.md).
// The same data-issue-path exists on the keycap, which comes first in the DOM, so IssueButton
// focuses the canvas keycap; this header is the fallback when the canvas is unavailable.
function RowHeader(props: RowProps) {
  const { layerIndex, keyId, onSelectionChange, onActiveKeyChange } = props;
  function handleFocus() {
    onActiveKeyChange(keyId);
    onSelectionChange([keyId]);
  }

  return (
    <th
      className="font-medium"
      data-issue-path={`layers.${layerIndex}.bindings.${keyId}`}
      onFocus={handleFocus}
      scope="row"
      tabIndex={-1}
    >
      {formatSelectionName(props.project, [keyId])}
    </th>
  );
}

function ChooseButton(props: RowProps) {
  const { keyId, keyIndex, onChooseAction } = props;
  const name = formatSelectionName(props.project, [keyId]);
  function handleClick() {
    onChooseAction(keyId);
  }

  return (
    <Button
      aria-label={
        name.startsWith('Key ') ? `Choose action for key ${keyIndex}` : `Choose action for ${name}`
      }
      onClick={handleClick}
      size="sm"
      variant="secondary"
    >
      Choose action
    </Button>
  );
}

function formatRowBinding({ project, layerIndex }: BindingsTableRowsProps, keyId: string): string {
  return formatBindingName(project.layers[layerIndex]?.bindings[keyId], project.layers, project);
}

function SizeButton({ project, keyId, keyIndex, onKeycapSize }: RowProps) {
  if (project.encoders.some((encoder) => encoder.pushKeyId === keyId)) {
    return null;
  }
  function handleClick() {
    onKeycapSize(keyId);
  }
  return (
    <Button
      aria-label={`Keycap size for key ${keyIndex}`}
      onClick={handleClick}
      size="sm"
      variant="secondary"
    >
      Keycap size
    </Button>
  );
}
