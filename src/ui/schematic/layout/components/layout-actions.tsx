import { KleImport } from './kle-import';
import { duplicateKeys, removeKeys, renumberKeys } from '@domain/keys';
import { PROJECT_BUDGET } from '@storage/project';
import { useProject } from '@ui/project/logic';
import { Button } from '@ui/components/components';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import type { PartsTableProps } from '@ui/schematic/parts/components';

const LIMIT_MESSAGE = `A project can contain at most ${PROJECT_BUDGET.keys} keys. Delete keys before duplicating.`;

export function LayoutActions({ project, selection, onSelectionChange, commit }: PartsTableProps) {
  const { announce } = useProject();
  const keyIds = getSelectedKeyIds(selection, { project }).filter((id) =>
    project.keys.some((key) => key.id === id),
  );
  function handleDuplicateClick() {
    const next = duplicateKeys(project, { keyIds, maxKeyCount: PROJECT_BUDGET.keys });
    if (next === project) {
      announce(LIMIT_MESSAGE);
      return;
    }
    commit(
      (current) => duplicateKeys(current, { keyIds, maxKeyCount: PROJECT_BUDGET.keys }),
      `Duplicated ${keyIds.length} keys without wires`,
    );
    onSelectionChange({
      kind: 'multi',
      keyIds: next.keys.slice(project.keys.length).map((key) => key.id),
      wireIds: [],
    });
  }
  function handleDeleteClick() {
    commit((current) => removeKeys(current, { keyIds }), `Deleted ${keyIds.length} keys`);
    onSelectionChange();
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[data-parts-add="key"]')?.focus();
    });
  }
  return (
    <LayoutActionButtons
      isEmpty={keyIds.length === 0}
      onDuplicate={handleDuplicateClick}
      onDelete={handleDeleteClick}
      onRenumber={() => {
        commit((current) => renumberKeys(current), 'Renumbered keys by position');
      }}
    />
  );
}

function LayoutActionButtons({
  isEmpty,
  onDuplicate,
  onDelete,
  onRenumber,
}: {
  readonly isEmpty: boolean;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  readonly onRenumber: () => void;
}) {
  function handleDuplicateClick() {
    onDuplicate();
  }
  function handleDeleteClick() {
    onDelete();
  }
  function handleRenumberClick() {
    onRenumber();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button isDisabled={isEmpty} onClick={handleDuplicateClick} size="sm">
        Duplicate selected keys
      </Button>
      <Button isDisabled={isEmpty} onClick={handleDeleteClick} size="sm" variant="danger">
        Delete selected keys
      </Button>
      <KleImport />
      <Button onClick={handleRenumberClick} size="sm">
        Renumber by position
      </Button>
    </div>
  );
}
