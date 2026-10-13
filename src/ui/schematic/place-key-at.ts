import { PROJECT_BUDGET } from '../../storage/project-budget';
import { addKey } from '../../domain/add-key';
import { createEntityId } from '../../domain/create-entity-id';
import { isKeyPositionFree } from '../../domain/is-key-position-free';
import type { WirePoint } from '../../domain/types';
import type { PointerState } from './pointer-types';
import { snapPoint } from './snap-point';

// Key tool: a key centered on the pointer, its top-left on the grid (003 R9).
export function placeKeyAt(state: PointerState, world: WirePoint) {
  if (state.project.keys.length >= PROJECT_BUDGET.keys) {
    state.onHint(`A project can contain at most ${PROJECT_BUDGET.keys} keys.`);
    return;
  }
  const position = snapPoint({ xU: world.xU - 0.5, yU: world.yU - 0.5 }, state.snapGridU);
  if (!isKeyPositionFree(state.project, { position })) {
    state.onHint('There is already a key here.');
    return;
  }
  const existingIds = state.project.keys.map((key) => key.id);
  const keyId = createEntityId({ prefix: 'k', existingIds });
  state.commit(
    (project) => addKey(project, { position, maxKeyCount: PROJECT_BUDGET.keys }),
    `Added key ${existingIds.length}`,
  );
  state.onSelectionChange({ kind: 'key', keyId });
}
