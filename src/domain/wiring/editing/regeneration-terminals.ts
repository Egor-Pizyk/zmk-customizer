import { createWiringTerminals } from '@domain/wiring';
import type { WiringCell } from '@domain/wiring/matrix';
import type { Project, Wiring, WiringTerminal } from '@domain';
import type { ResolvedWiringScope } from './resolve-wiring-scope';

type Targets = { readonly cells: readonly WiringCell[]; readonly scope: ResolvedWiringScope };

export function getRegenerationTerminals(
  project: Project & { readonly wiring: Wiring },
  targets: Targets,
) {
  const scoped = targets.cells.map((cell) => scopedCell(cell, targets.scope.pinIds));
  const generated = createWiringTerminals(project, project.wiring, { cells: scoped });
  const required = generated.filter((terminal) =>
    isRequired(terminal, { generated, cells: scoped }),
  );
  const terminals = [...project.wiring.terminals];
  for (const terminal of required) {
    if (!terminals.some((entry) => entry.id === terminal.id)) {
      terminals.push(terminal);
    }
  }
  return { terminals, requiredIds: new Set(required.map((terminal) => terminal.id)) };
}

function scopedCell(cell: WiringCell, pinIds: readonly string[]): WiringCell {
  const rowPin = cell.rowPin ?? 1;
  const colPin = rowPin === 1 ? 2 : 1;
  return {
    keyId: cell.keyId,
    half: cell.half,
    rowPin,
    ...(pinIds.includes(`${cell.keyId}:${rowPin}`) && cell.row !== undefined
      ? { row: cell.row }
      : {}),
    ...(pinIds.includes(`${cell.keyId}:${colPin}`) && cell.col !== undefined
      ? { col: cell.col }
      : {}),
  };
}

function isRequired(
  terminal: WiringTerminal,
  input: { readonly generated: readonly WiringTerminal[]; readonly cells: readonly WiringCell[] },
): boolean {
  if (terminal.kind !== 'row' && terminal.kind !== 'col') {
    return false;
  }
  const index = input.generated
    .filter((entry) => entry.half === terminal.half && entry.kind === terminal.kind)
    .indexOf(terminal);
  return input.cells.some(
    (cell) =>
      cell.half === terminal.half &&
      (terminal.kind === 'row' ? (cell.row ?? -1) : (cell.col ?? -1)) >= index,
  );
}
