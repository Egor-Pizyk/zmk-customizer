import { assignAutoPins } from './assign-auto-pins';
import type { WiringEdit } from './wiring-edit';
import type { ControllerBoard, Project, Result, WiringTerminal } from '@domain';

export function prepareTerminals(
  project: Project,
  input: WiringEdit,
  terminals: readonly WiringTerminal[],
): Result<readonly WiringTerminal[], string> {
  if (input.kind === 'auto') {
    return assignAutoPins(project, { board: input.board, terminals });
  }
  const error = getPinCapacityError(terminals, input.board);
  return error === undefined ? { ok: true, value: terminals } : { ok: false, error };
}

function getPinCapacityError(
  terminals: readonly WiringTerminal[],
  board: ControllerBoard,
): string | undefined {
  for (const half of ['left', 'right']) {
    const requiredPins = terminals.filter(
      (terminal) => terminal.half === half && terminal.kind !== 'ground',
    ).length;
    if (requiredPins > board.gpioPins.length) {
      return `${half} needs ${requiredPins} GPIOs, but ${board.name} exposes ${board.gpioPins.length}. Reduce the dimensions.`;
    }
  }

  return undefined;
}
