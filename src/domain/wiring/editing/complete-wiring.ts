import type { WiringCell } from '@domain/wiring/matrix';
import { autoAssignCells, createWiringTerminals, getWiringConnections } from '@domain/wiring';
import { getWiringCells } from '@domain/wiring/matrix';
import { findKeyCurrentFlow } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { initializeWiring } from './initialize-wiring';
import { adoptManualTerminals } from './adopt-manual-terminals';
import { assignAutoPins } from './assign-auto-pins';
import { routeWiring } from './route-wiring';
import type { ControllerBoard, Project, Result, Wiring } from '@domain';

export function completeWiring(
  original: Project,
  input: { readonly board: ControllerBoard; readonly gridStepU: number },
): Result<Project, string> {
  if (original.keys.length === 0) {
    return { ok: false, error: 'Add keys before completing wiring.' };
  }
  const project = initializeWiring(original, input.board);
  const nets = getNets(project);
  if (nets.some((net) => net.terminalIds.length > 1)) {
    return {
      ok: false,
      error: 'A conductor joins different wiring terminals. Repair its wires before completing.',
    };
  }
  const cells = getCompletionCells(project, input.gridStepU);
  const conflict = findCellConflict(project, cells) ?? findDiodeConflict(project, cells);
  if (conflict !== undefined) {
    return { ok: false, error: conflict };
  }
  const prepared = prepareCompletion(project, cells, input.board);
  if (!prepared.ok) {
    return prepared;
  }
  const candidate = prepared.value;
  const routed = routeWiring(candidate, {
    connections: getWiringConnections(candidate.wiring, cells),
    terminalIds: [],
    retainAllWires: true,
  });
  if (!routed.ok) {
    return routed;
  }
  return completedProject(original, routed.value);
}

function getCompletionCells(project: Project & { readonly wiring: Wiring }, gridStepU: number) {
  const candidates = autoAssignCells(project, {
    topology: project.wiring.topology,
    gridStepU,
  });
  return getWiringCells(project).map((cell, index) => {
    const candidate = candidates.find((entry) => entry.keyId === cell.keyId);
    const flow = findKeyCurrentFlow(project.keys.find((key) => key.id === cell.keyId));
    const diodeRowPin = project.wiring.diodeDirection === 'col2row' ? flow?.toPin : flow?.fromPin;
    return {
      keyId: cell.keyId,
      half: cell.half,
      row: cell.row ?? (project.wiring.kind === 'direct' ? 0 : (candidate?.row ?? 0)),
      col:
        cell.col ??
        (project.wiring.kind === 'direct'
          ? project.keys.slice(0, index).filter((key) => (key.half ?? 'left') === cell.half).length
          : (candidate?.col ?? 0)),
      rowPin: cell.rowPin ?? diodeRowPin ?? 1,
    };
  });
}

function findCellConflict(project: Project, cells: readonly WiringCell[]): string | undefined {
  const occupied = new Set<string>();
  for (const cell of cells) {
    const identity = `${cell.half}:${cell.row}:${cell.col}`;
    if (occupied.has(identity)) {
      return `Key ${project.keys.findIndex((key) => key.id === cell.keyId)} would occupy an existing cell. Assign its row and column manually.`;
    }
    occupied.add(identity);
  }
  return undefined;
}

function getCompletionKeys(
  project: Project & { readonly wiring: Wiring },
  cells: readonly WiringCell[],
) {
  return project.keys.map((key) => {
    if (project.wiring.kind !== 'matrix' || key.diode !== undefined) {
      return key;
    }
    return {
      ...key,
      diode: {
        pin: cells.find((cell) => cell.keyId === key.id)?.rowPin ?? 1,
        cathode:
          project.wiring.diodeDirection === 'col2row'
            ? ('away-switch' as const)
            : ('toward-switch' as const),
      },
    };
  });
}

function getCompletionTerminals(
  project: Project & { readonly wiring: Wiring },
  cells: readonly WiringCell[],
) {
  const terminals = [...project.wiring.terminals];
  for (const terminal of createWiringTerminals(project, project.wiring, { cells })) {
    if (!terminals.some((entry) => entry.id === terminal.id)) {
      terminals.push(terminal);
    }
  }
  return terminals;
}

function completedProject(original: Project, value: Project): Result<Project, string> {
  return { ok: true, value: JSON.stringify(value) === JSON.stringify(original) ? original : value };
}

function prepareCompletion(
  project: Project & { readonly wiring: Wiring },
  cells: readonly WiringCell[],
  board: ControllerBoard,
): Result<Project & { readonly wiring: Wiring }, string> {
  const terminals = getCompletionTerminals(project, cells);
  const wiring = { ...project.wiring, terminals };
  const adopted = adoptManualTerminals({ ...project, wiring }, getWiringConnections(wiring, cells));
  if (!adopted.ok) {
    return adopted;
  }
  const assigned = assignAutoPins(adopted.value, {
    board,
    terminals: adopted.value.wiring.terminals,
    retainAllWires: true,
  });
  if (!assigned.ok) {
    return assigned;
  }
  return {
    ok: true,
    value: {
      ...adopted.value,
      keys: getCompletionKeys(project, cells),
      wiring: {
        ...wiring,
        terminals: adopted.value.wiring.terminals.map(
          (terminal) => assigned.value.find((entry) => entry.id === terminal.id) ?? terminal,
        ),
      },
    },
  };
}

function findDiodeConflict(
  project: Project & { readonly wiring: Wiring },
  cells: readonly WiringCell[],
) {
  const invalid = project.keys.some((key) => {
    if (key.diode === undefined) {
      return false;
    }
    if (project.wiring.kind === 'direct') {
      return true;
    }
    const cell = cells.find((entry) => entry.keyId === key.id);
    const flow = findKeyCurrentFlow(key);
    return (
      (project.wiring.diodeDirection === 'col2row' ? flow?.toPin : flow?.fromPin) !== cell?.rowPin
    );
  });
  return invalid
    ? 'A retained diode conflicts with the assigned cells. Repair its orientation before completing.'
    : undefined;
}
