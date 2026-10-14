import { getSelectedKeyIds, focusAfterDelete } from '@ui/schematic/interaction';
import { KeySelectCell } from './key-select-cell';
import { removeKey } from '@domain/keys';
import { Button } from '@ui/components/components';
import type { WiresOfPin } from '@ui/schematic/formatting';
import { RowPinCells } from './key-pin-cell';
import { KeyPositionCells } from './key-position-cells';
import type { PartsTableProps } from './parts-list';
import type { FocusEvent } from 'react';

type SelectionCellProps = {
  readonly activeKeyId: string | undefined;
  readonly onActiveKeyChange: (keyId: string) => void;
};

export function PartsKeysTableRows(
  props: PartsTableProps & SelectionCellProps & { readonly wiresOf: WiresOfPin },
) {
  const { project, wiresOf } = props;
  return project.keys.map((key, keyIndex) => (
    <KeyRow {...props} key={key.id} keyIndex={keyIndex} schematicKey={key} wiresOf={wiresOf} />
  ));
}

type KeyRowProps = PartsTableProps &
  SelectionCellProps & {
    readonly schematicKey: PartsTableProps['project']['keys'][number];
    readonly keyIndex: number;
    readonly wiresOf: WiresOfPin;
  };

function KeyRow(props: KeyRowProps) {
  const { issues, selection, onSelectionChange, commit, schematicKey, keyIndex, wiresOf } = props;
  const problems = issues.filter((issue) => issue.path.join('.') === `keys.${keyIndex}`);
  const isSelected = getSelectedKeyIds(selection).includes(schematicKey.id);

  function handleFocus(event: FocusEvent<HTMLTableRowElement>) {
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      return;
    }
    if (!getSelectedKeyIds(selection).includes(schematicKey.id)) {
      onSelectionChange({ kind: 'key', keyId: schematicKey.id });
    }
  }

  return (
    <tr
      className="data-selected:bg-surface-muted"
      data-selected={isSelected || undefined}
      onFocus={handleFocus}
    >
      <KeySelectCell {...props} keyId={schematicKey.id} />
      <KeyRowHeader keyIndex={keyIndex} problems={problems} />
      <KeyPositionCells
        commit={commit}
        hasProblem={problems.length > 0}
        keyIndex={keyIndex}
        schematicKey={schematicKey}
      />
      <RowPinCells
        commit={commit}
        schematicKey={schematicKey}
        keyIndex={keyIndex}
        wiresOf={wiresOf}
      />
      <KeyRowDeleteButton {...props} keyId={schematicKey.id} />
    </tr>
  );
}

function KeyRowDeleteButton({
  keyIndex,
  keyId,
  commit,
  onSelectionChange,
}: Pick<PartsTableProps, 'commit' | 'onSelectionChange'> & {
  readonly keyIndex: number;
  readonly keyId: string;
}) {
  function handleDeleteClick() {
    commit((current) => removeKey(current, { keyId }), `Deleted key ${keyIndex}`);
    onSelectionChange();
    focusAfterDelete({ table: 'key', index: keyIndex });
  }
  return (
    <td>
      <Button
        aria-label={`Delete key ${keyIndex}`}
        data-parts-delete={`key:${keyIndex}`}
        onClick={handleDeleteClick}
        size="sm"
      >
        Delete
      </Button>
    </td>
  );
}

type KeyRowHeaderProps = {
  readonly keyIndex: number;
  readonly problems: PartsTableProps['issues'];
};

function KeyRowHeader({ keyIndex, problems }: KeyRowHeaderProps) {
  return (
    <th className="pr-2 font-medium" scope="row">
      {`Key ${keyIndex}`}
      {problems.map((issue) => (
        <span className="block text-xs text-danger" key={issue.code}>
          {issue.message}
        </span>
      ))}
    </th>
  );
}
