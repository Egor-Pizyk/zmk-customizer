import { PROJECT_BUDGET } from '../../storage/project-budget';
import { addKey } from '../../domain/add-key';
import { findFreeKeyPosition } from '../../domain/find-free-key-position';
import { Button } from '../components/button';
import type { PartsTableProps } from './parts-list';

export function AddKeyButton({ project, commit }: Pick<PartsTableProps, 'project' | 'commit'>) {
  function handleAddClick() {
    commit(
      (current) =>
        addKey(current, {
          position: findFreeKeyPosition(current),
          maxKeyCount: PROJECT_BUDGET.keys,
        }),
      `Added key ${project.keys.length}`,
    );
  }
  return (
    <Button
      className="self-start"
      data-parts-add="key"
      data-issue-path="keys"
      isDisabled={project.keys.length >= PROJECT_BUDGET.keys}
      onClick={handleAddClick}
      size="sm"
      variant="secondary"
    >
      Add key
    </Button>
  );
}
