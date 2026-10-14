import { hasWiring } from '@domain/wiring';
import { findKeyCurrentFlow } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getWiringCells } from './get-wiring-cells';
import type { ShieldMatrix } from './derive-shield-matrix';
import type { ControllerBoard, Half, Project, Result, ValidationIssue, Wiring } from '@domain';

export function deriveWiring(
  project: Project,
  board: Pick<ControllerBoard, 'id' | 'gpioPins' | 'ble'>,
): Result<ShieldMatrix, readonly ValidationIssue[]> {
  if (!hasWiring(project)) {
    return { ok: false, error: [] };
  }
  const wiring = project.wiring;
  const issues: ValidationIssue[] = [];
  const cells = getWiringCells(project);
  const halves = ['left', ...(wiring.topology === 'split' ? (['right'] as const) : [])] as const;
  const scans: Record<Half, { rowPins: number[]; colPins: number[] }> = {
    left: { rowPins: [], colPins: [] },
    right: { rowPins: [], colPins: [] },
  };
  if (wiring.topology === 'split' && !board.ble) {
    issues.push({
      code: 'wiring-split-unsupported',
      message: 'Split requires a Bluetooth controller. Select a BLE board or use unibody.',
      path: ['controllerId'],
    });
  }
  collectTerminalShapeIssues(wiring, issues);
  collectHalfIssues(project, board, { halves, cells, scans, issues });
  collectCellIssues(project, { cells, nets: getNets(project), issues });
  const width = scans.left.colPins.length + scans.right.colPins.length;
  if (width > 255) {
    issues.push({
      code: 'wiring-dimension-invalid',
      message: 'Combined columns exceed 255. Reduce dimensions.',
      path: ['wiring'],
    });
  }
  return issues.length > 0
    ? { ok: false, error: issues }
    : {
        ok: true,
        value: createMatrix(wiring, cells, scans),
      };
}

type Scans = Record<Half, { rowPins: number[]; colPins: number[] }>;
type Cells = ReturnType<typeof getWiringCells>;

function collectHalfIssues(
  project: Project & { readonly wiring: Wiring },
  board: Pick<ControllerBoard, 'id' | 'gpioPins'>,
  context: { halves: readonly Half[]; cells: Cells; scans: Scans; issues: ValidationIssue[] },
) {
  const wiring = project.wiring;
  const { halves, cells, scans, issues } = context;
  for (const half of halves) {
    const terminals = wiring.terminals.filter((terminal) => terminal.half === half);
    if (!cells.some((cell) => cell.half === half)) {
      issues.push({
        code: 'wiring-half-empty',
        message: `${half} has no keys. Assign keys to this half.`,
        path: ['wiring'],
      });
    }
    for (const kind of wiring.kind === 'matrix'
      ? (['row', 'col'] as const)
      : (['input'] as const)) {
      const entries = terminals.filter((terminal) => terminal.kind === kind);
      const pins = entries.map((terminal) => terminal.boardPin ?? -1);
      if (kind === 'row') {
        scans[half].rowPins = pins;
      } else {
        scans[half].colPins = pins;
      }
      if (pins.length === 0 || pins.length > 255) {
        issues.push({
          code: 'wiring-dimension-invalid',
          message: `${half} ${kind} count must be 1–255. Set dimensions in Wiring.`,
          path: ['wiring'],
        });
      }
    }
    collectPinIssues(wiring, { terminals, half, board, issues });
  }
}

function collectCellIssues(
  project: Project & { readonly wiring: Wiring },
  context: { cells: Cells; nets: ReturnType<typeof getNets>; issues: ValidationIssue[] },
) {
  const { cells, nets, issues } = context;
  for (const [keyIndex, cell] of cells.entries()) {
    collectKeyIssues(project, cell, { keyIndex, cells, nets, issues });
  }
}

function createMatrix(wiring: Wiring, cells: Cells, scans: Scans): ShieldMatrix {
  return {
    rowPins:
      wiring.kind === 'direct'
        ? [0]
        : Array.from(
            { length: Math.max(scans.left.rowPins.length, scans.right.rowPins.length) },
            (_, index) => scans.left.rowPins[index] ?? 0,
          ),
    colPins: [...scans.left.colPins, ...scans.right.colPins],
    cells: cells.map((cell) => ({
      row: wiring.kind === 'direct' ? 0 : (cell.row ?? 0),
      col: (cell.col ?? 0) + (cell.half === 'right' ? scans.left.colPins.length : 0),
    })),
    diodeDirection: wiring.diodeDirection,
    kind: wiring.kind,
    ...(wiring.topology === 'split' ? { halves: scans } : {}),
  };
}

function collectPinIssues(
  wiring: Wiring,
  context: {
    terminals: Wiring['terminals'];
    half: Half;
    board: Pick<ControllerBoard, 'id' | 'gpioPins'>;
    issues: ValidationIssue[];
  },
) {
  const { terminals, half, board, issues } = context;
  for (const terminal of terminals.filter((entry) => entry.kind !== 'ground')) {
    const terminalIndex = wiring.terminals.indexOf(terminal);
    const path = ['wiring', 'terminals', terminalIndex, 'boardPin'];
    if (terminal.boardPin === undefined) {
      issues.push({
        code: 'wiring-pin-missing',
        message: `${half} ${terminal.kind} ${terminal.id} has no pin. Assign a controller pin.`,
        path,
      });
    } else if (!board.gpioPins.includes(terminal.boardPin)) {
      issues.push({
        code: 'shield-pin-unsupported',
        message: `D${terminal.boardPin} is unavailable on ${board.id}. Choose an exposed pin.`,
        path,
      });
    }
    if (
      terminal.boardPin !== undefined &&
      terminals.some((other) => other.id !== terminal.id && other.boardPin === terminal.boardPin)
    ) {
      issues.push({
        code: 'board-pin-conflict',
        message: `D${terminal.boardPin} is used twice on ${half}. Choose a different pin.`,
        path,
      });
    }
  }
}

function collectKeyIssues(
  project: Project & { readonly wiring: Wiring },
  cell: Cells[number],
  context: CollectKeyIssuesInput,
) {
  const wiring = project.wiring;
  const { keyIndex, cells, nets, issues } = context;
  const keyNets = nets.filter((net) => net.pins.some((pin) => pin.keyId === cell.keyId));
  const terminalIds = new Set(keyNets.flatMap((net) => net.terminalIds));
  const connected = wiring.terminals.filter((terminal) => terminalIds.has(terminal.id));
  const expectedKinds = wiring.kind === 'matrix' ? ['row', 'col'] : ['input', 'ground'];
  const hasConflict =
    keyNets.length !== 2 ||
    expectedKinds.some(
      (kind) =>
        connected.filter((terminal) => terminal.kind === kind && terminal.half === cell.half)
          .length !== 1,
    ) ||
    connected.length !== 2;
  if (
    hasConflict ||
    cell.col === undefined ||
    (wiring.kind === 'matrix' && cell.row === undefined)
  ) {
    issues.push({
      code: 'wiring-cell-missing',
      message: `Key ${keyIndex} needs exactly one ${wiring.kind === 'matrix' ? 'row and column' : 'input and ground'} connection. Repair its wires or assign a cell.`,
      path: ['keys', keyIndex],
    });
  }
  collectHalfConflict(wiring, cell, { connected, keyIndex, issues });
  collectDiodeAndCellIssues(project, cell, { keyIndex, cells, issues });
}

function collectDiodeAndCellIssues(
  project: Project & { readonly wiring: Wiring },
  cell: Cells[number],
  context: CollectDiodeAndCellIssuesInput,
) {
  const wiring = project.wiring;
  const { keyIndex, issues } = context;
  const key = project.keys[keyIndex];
  if (wiring.kind === 'direct' && key?.diode !== undefined) {
    issues.push({
      code: 'matrix-diode-conflict',
      message: `Key ${keyIndex} has a diode. Remove it for direct scanning.`,
      path: ['keys', keyIndex],
    });
  }
  if (wiring.kind === 'matrix') {
    const flow = findKeyCurrentFlow(key);
    const oppositePin = cell.rowPin === 1 ? 2 : 1;
    const expectedFrom = wiring.diodeDirection === 'row2col' ? cell.rowPin : oppositePin;
    if (flow === undefined || flow.fromPin !== expectedFrom) {
      issues.push({
        code: 'matrix-diode-conflict',
        message: `Key ${keyIndex} diode disagrees with ${wiring.diodeDirection}. Reverse the diode or change direction.`,
        path: ['keys', keyIndex],
      });
    }
  }
  collectDuplicateCellIssue(cell, context);
}

type CollectKeyIssuesInput = {
  keyIndex: number;
  cells: Cells;
  nets: ReturnType<typeof getNets>;
  issues: ValidationIssue[];
};

type CollectDiodeAndCellIssuesInput = { keyIndex: number; cells: Cells; issues: ValidationIssue[] };

function collectDuplicateCellIssue(
  cell: Cells[number],
  { cells, keyIndex, issues }: CollectDiodeAndCellIssuesInput,
) {
  const duplicate = cells.findIndex(
    (other, otherIndex) =>
      otherIndex !== keyIndex &&
      other.half === cell.half &&
      other.row === cell.row &&
      other.col === cell.col &&
      other.col !== undefined,
  );
  if (duplicate !== -1) {
    issues.push({
      code: 'keys-in-parallel',
      message: `Key ${keyIndex} shares its cell with key ${duplicate}. Assign a different cell.`,
      path: ['keys', keyIndex],
    });
  }
}

function collectHalfConflict(
  wiring: Wiring,
  cell: Cells[number],
  context: { connected: Wiring['terminals']; keyIndex: number; issues: ValidationIssue[] },
) {
  const { connected, keyIndex, issues } = context;
  if (
    connected.some((terminal) => terminal.half !== cell.half) ||
    (wiring.topology === 'unibody' && cell.half === 'right')
  ) {
    issues.push({
      code: 'wiring-half-conflict',
      message: `Key ${keyIndex} connects different halves. Reassign its half or repair its wires.`,
      path: ['keys', keyIndex],
    });
  }
}

function collectTerminalShapeIssues(wiring: Wiring, issues: ValidationIssue[]) {
  const kinds = wiring.kind === 'matrix' ? ['row', 'col'] : ['input', 'ground'];
  for (const [index, terminal] of wiring.terminals.entries()) {
    if (
      !kinds.includes(terminal.kind) ||
      (wiring.topology === 'unibody' && terminal.half === 'right')
    ) {
      issues.push({
        code: 'wiring-terminal-conflict',
        message: `Terminal ${terminal.id} does not belong to this scan or topology. Convert the wiring or remove the invalid terminal.`,
        path: ['wiring', 'terminals', index, 'boardPin'],
      });
    }
  }
}
