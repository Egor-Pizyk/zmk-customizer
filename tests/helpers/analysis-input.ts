import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getControllerBoard } from '@catalog/controllers';

export function createAnalysisInput() {
  const board = getControllerBoard('nice_nano_v2');
  return {
    firmwareOptions: FIRMWARE_OPTIONS,
    board,
    bindingsCatalog: BINDINGS_CATALOG,
    target: { ...board, boardId: board.id },
  };
}
