import { createEntityId } from '../project/create-entity-id';
import type { WiringCell } from './get-wiring-cells';
import type { Project, Wiring, WiringTerminal, Half } from '../types';

export function createWiringTerminals(
  project: Project,
  wiring: Wiring,
  input: {
    readonly cells: readonly WiringCell[];
    readonly dimensions?: { readonly half: Half; readonly rows: number; readonly cols: number };
  },
): WiringTerminal[] {
  const { cells, dimensions } = input;
  const terminals: WiringTerminal[] = [];
  const existingIds = project.wiring?.terminals.map((terminal) => terminal.id) ?? [];
  for (const half of [
    'left',
    ...(wiring.topology === 'split' ? (['right'] as const) : []),
  ] as const) {
    const halfCells = cells.filter((cell) => cell.half === half);
    let rows = 1;
    let cols = 1;
    for (const cell of halfCells) {
      rows = Math.max(rows, (cell.row ?? 0) + 1);
      cols = Math.max(cols, (cell.col ?? 0) + 1);
    }
    if (dimensions?.half === half) {
      rows = dimensions.rows;
      cols = dimensions.cols;
    }
    const kinds =
      wiring.kind === 'matrix' ? (['row', 'col'] as const) : (['input', 'ground'] as const);

    for (const kind of kinds) {
      const axisCount = kind === 'row' ? rows : cols;
      const count = kind === 'ground' ? 1 : axisCount;
      terminals.push(...createAxisTerminals(project, { half, kind, count, existingIds }));
    }
  }
  return terminals;
}

function createAxisTerminals(
  project: Project,
  input: { half: Half; kind: WiringTerminal['kind']; count: number; existingIds: string[] },
) {
  const { half, kind, count, existingIds } = input;
  const terminals: WiringTerminal[] = [];
  const previous =
    project.wiring?.terminals.filter(
      (terminal) => terminal.half === half && terminal.kind === kind,
    ) ?? [];
  for (let index = 0; index < count; index += 1) {
    const old = previous[index];
    const id = old?.id ?? createEntityId({ prefix: 't', existingIds });
    if (old === undefined) {
      existingIds.push(id);
    }
    const terminal = old ?? { id, half, kind };

    terminals.push(terminal);
  }
  return terminals;
}
