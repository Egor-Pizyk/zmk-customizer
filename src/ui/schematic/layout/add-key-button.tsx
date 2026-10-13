import { PROJECT_BUDGET } from '@storage/project';
import { addKey, findFreeKeyPosition } from '@domain';
import { Button } from '@ui/components';
import type { PartsTableProps } from '../parts/parts-list';

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
