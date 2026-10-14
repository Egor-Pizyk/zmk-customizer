import { hasWiring } from '@domain/wiring';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import type { ControllerBoard, Project, Wiring, WiringTerminal } from '@domain';

export function initializeWiring(
  project: Project,
  board: ControllerBoard,
): Project & { readonly wiring: Wiring } {
  if (hasWiring(project)) {
    return project;
  }
  const matrix = deriveShieldMatrix(project, { boardId: board.id, gpioPins: board.gpioPins });
  const terminals: WiringTerminal[] = [];
  if (matrix.ok) {
    for (const kind of ['row', 'col'] as const) {
      for (const boardPin of kind === 'row' ? matrix.value.rowPins : matrix.value.colPins) {
        terminals.push({ id: `t${terminals.length}`, half: 'left', kind, boardPin });
      }
    }
  }
  return {
    ...project,
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: matrix.ok ? matrix.value.diodeDirection : 'col2row',
      terminals,
    },
    wires: project.wires.map((wire) => {
      function toTerminal(end: typeof wire.start) {
        if (end.kind !== 'free' || end.boardPin === undefined) {
          return end;
        }
        const terminal = terminals.find((entry) => entry.boardPin === end.boardPin);
        return terminal === undefined
          ? end
          : { kind: 'free' as const, at: end.at, terminalId: terminal.id };
      }
      return { ...wire, start: toTerminal(wire.start), end: toTerminal(wire.end) };
    }),
  };
}
