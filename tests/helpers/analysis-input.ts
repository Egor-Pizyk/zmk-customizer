import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getControllerBoard } from '@catalog/controllers';

export function createAnalysisInput() {
  const board = getControllerBoard('nice_nano_v2');
  return { board, bindingsCatalog: BINDINGS_CATALOG, target: { ...board, boardId: board.id } };
}
