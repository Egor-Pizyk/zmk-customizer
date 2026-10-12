import { BINDINGS_CATALOG } from '../../src/catalog/bindings-catalog';
import { getControllerBoard } from '../../src/catalog/get-controller-board';

export function createAnalysisInput() {
  const board = getControllerBoard('nice_nano_v2');
  return { board, bindingsCatalog: BINDINGS_CATALOG, target: { ...board, boardId: board.id } };
}
