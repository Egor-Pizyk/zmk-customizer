import { addKey } from '../../domain/add-key';
import { findFreeKeyPosition } from '../../domain/find-free-key-position';
import { removeKey } from '../../domain/remove-key';
import type { Key } from '../../domain/types';
import { Button } from '../components/button';
import { focusAfterDelete } from './focus-after-delete';
import { KeyPinCell } from './key-pin-cell';
import { KeyPositionCells } from './key-position-cells';
import type { PartsTableProps } from './parts-list';
import { PartsTableHead } from './parts-table-head';

const COLUMNS = ['Key', 'X (u)', 'Y (u)', 'Pin 1', 'Pin 2'];

export function PartsKeysTable(props: PartsTableProps) {
  const { project, commit } = props;

  function handleAddClick() {
    commit(
      (current) => addKey(current, { position: findFreeKeyPosition(current) }),
      `Added key ${project.keys.length}`,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Keys</h3>
      {project.keys.length === 0 ? (
        <p className="text-text-muted">
          No keys yet. Pick the Key tool and click the canvas, or add one here.
        </p>
      ) : (
        <table className="w-full text-left">
          <PartsTableHead columns={COLUMNS} hasActions />
          <tbody>
            {project.keys.map((key, keyIndex) => (
              <KeyRow {...props} key={key.id} keyIndex={keyIndex} schematicKey={key} />
            ))}
          </tbody>
        </table>
      )}
      <Button
        className="self-start"
        data-parts-add="key"
        onClick={handleAddClick}
        size="sm"
        variant="secondary"
      >
        Add key
      </Button>
    </div>
  );
}

type KeyRowProps = PartsTableProps & { readonly schematicKey: Key; readonly keyIndex: number };

function KeyRow(props: KeyRowProps) {
  const { project, issues, selection, onSelectionChange, commit, schematicKey, keyIndex } = props;
  const problems = issues.filter((issue) => issue.path.join('.') === `keys.${keyIndex}`);
  const isSelected =
    (selection?.kind === 'key' && selection.keyId === schematicKey.id) ||
    (selection?.kind === 'multi' && selection.keyIds.includes(schematicKey.id));

  function handleFocus() {
    onSelectionChange({ kind: 'key', keyId: schematicKey.id });
  }

  function handleDeleteClick() {
    commit((current) => removeKey(current, { keyId: schematicKey.id }), `Deleted key ${keyIndex}`);
    onSelectionChange();
    focusAfterDelete({ table: 'key', index: keyIndex });
  }

  return (
    <tr
      className="data-selected:bg-surface-muted"
      data-selected={isSelected || undefined}
      onFocus={handleFocus}
    >
      <KeyRowHeader keyIndex={keyIndex} problems={problems} />
      <KeyPositionCells
        commit={commit}
        hasProblem={problems.length > 0}
        keyIndex={keyIndex}
        schematicKey={schematicKey}
      />
      <KeyPinCell keyId={schematicKey.id} keyIndex={keyIndex} pin={1} project={project} />
      <KeyPinCell keyId={schematicKey.id} keyIndex={keyIndex} pin={2} project={project} />
      <KeyRowDeleteButton keyIndex={keyIndex} onDeleteClick={handleDeleteClick} />
    </tr>
  );
}

function KeyRowDeleteButton({
  keyIndex,
  onDeleteClick,
}: {
  keyIndex: number;
  onDeleteClick: () => void;
}) {
  return (
    <td>
      <Button
        aria-label={`Delete key ${keyIndex}`}
        data-parts-delete={`key:${keyIndex}`}
        onClick={onDeleteClick}
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
