import type { ControllerBoard } from '@domain';
import { CONTROLLER_BOARDS } from './controller-boards';

export function getControllerBoard(controllerId: string): ControllerBoard {
  const board = CONTROLLER_BOARDS.find((entry) => entry.id === controllerId);
  if (board === undefined) {
    throw new Error(`Unknown schema-validated controller: ${controllerId}`);
  }
  return board;
}
