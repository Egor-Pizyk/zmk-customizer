import { getControllerFixtures } from './controller-fixtures';
import { getDefinedValue } from './defined-value';
import { getResultValue } from './result';
import { editWiring } from '@domain';
import type { Project } from '@domain';

export function wiringBoard() {
  return getDefinedValue(getControllerFixtures().boards[0]);
}
export function buildWiringProject(
  kind: 'matrix' | 'direct' = 'matrix',
  topology: 'unibody' | 'split' = 'unibody',
): Project {
  const board = wiringBoard();
  let project = getResultValue(
    editWiring(getControllerFixtures().project, { kind: 'initialize', board }),
  );
  project = getResultValue(editWiring(project, { kind: 'mode', mode: kind, board }));
  project = getResultValue(editWiring(project, { kind: 'topology', topology, board }));
  for (const half of ['left', 'right'] as const) {
    const terminals = getDefinedValue(project.wiring)
      .terminals.filter((terminal) => terminal.half === half)
      .filter((terminal) => terminal.kind !== 'ground');
    for (const [index, terminal] of terminals.entries()) {
      project = getResultValue(
        editWiring(project, {
          kind: 'pin',
          terminalId: terminal.id,
          boardPin: getDefinedValue(board.gpioPins[index]),
          board,
        }),
      );
    }
  }
  return project;
}
