import type { Net } from './get-nets';
import type { Project, ValidationIssue } from './types';

export function validateNetsWithoutBoardPin(
  project: Project,
  nets: readonly Net[],
): ValidationIssue[] {
  return nets.flatMap((net) => {
    if (net.pins.length === 0 || net.boardPins.length > 0) {
      return [];
    }
    const firstPin = net.pins.toSorted((left, right) => {
      if (left.keyId !== right.keyId) {
        return left.keyId < right.keyId ? -1 : 1;
      }
      return left.pin - right.pin;
    })[0];
    if (firstPin === undefined) {
      return [];
    }
    const keyIndex = project.keys.findIndex((key) => key.id === firstPin.keyId);
    return [
      {
        code: 'net-without-board-pin',
        message: `Key ${keyIndex}, pin ${firstPin.pin} is on a connection with no board pin. Connect a free end to a board pin.`,
        path: ['keys', keyIndex, 'pins', firstPin.pin],
      },
    ];
  });
}
