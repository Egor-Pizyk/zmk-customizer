import { completeWiring } from './complete-wiring';
import { createWiringTerminals, autoAssignCells, getWiringConnections } from '@domain/wiring';
import { prepareTerminals } from './prepare-terminals';
import { initializeWiring } from './initialize-wiring';
import { getWiringCells } from '@domain/wiring/matrix';
import type { WiringCell } from '@domain/wiring/matrix';
import { routeWiring } from './route-wiring';
import type { WiringConnection } from './route-wiring';
import { routeMatrixWiring } from './route-matrix-wiring';
import type { ControllerBoard, Half, Project, Result, Wiring } from '@domain';

export type WiringEdit = { readonly board: ControllerBoard } & (
  | { readonly kind: 'initialize' }
  | { readonly kind: 'complete'; readonly gridStepU: number }
  | { readonly kind: 'auto'; readonly gridStepU: number }
  | { readonly kind: 'mode'; readonly mode: 'matrix' | 'direct' }
  | { readonly kind: 'topology'; readonly topology: 'unibody' | 'split' }
  | { readonly kind: 'direction'; readonly direction: Wiring['diodeDirection'] }
  | { readonly kind: 'pin'; readonly terminalId: string; readonly boardPin: number | undefined }
  | {
      readonly kind: 'cell';
      readonly keyId: string;
      readonly row: number;
      readonly col: number;
      readonly half: Half;
    }
  | {
      readonly kind: 'dimensions';
      readonly half: Half;
      readonly rows: number;
      readonly cols: number;
    }
);

export function editWiring(original: Project, input: WiringEdit): Result<Project, string> {
  if (input.kind === 'complete') {
    return completeWiring(original, input);
  }
  const project = initializeWiring(original, input.board);
  const wiring = project.wiring;
  if (input.kind === 'initialize') {
    return { ok: true, value: project };
  }
  if (input.kind === 'pin') {
    return editPin(original, project, input);
  }
  if (input.kind === 'direction') {
    return editDirection(original, project, input);
  }
  if (input.kind === 'dimensions' && hasSameDimensions(wiring, input)) {
    return { ok: true, value: original };
  }
  const prepared = prepareCells(project, input);
  if (!prepared.ok) {
    return prepared;
  }
  if (prepared.value === undefined) {
    return { ok: true, value: original };
  }
  const { cells, wiring: nextWiring } = prepared.value;
  return applyCells(project, input, { cells, wiring: nextWiring });
}

function applyCells(
  project: Project,
  input: WiringEdit,
  prepared: { cells: readonly WiringCell[]; wiring: Wiring },
): Result<Project, string> {
  const { cells, wiring } = prepared;
  let nextWiring = wiring;
  let terminals = createWiringTerminals(project, nextWiring, {
    cells,
    ...(input.kind === 'dimensions' ? { dimensions: input } : {}),
  });
  const assigned = prepareTerminals(project, input, terminals);
  if (!assigned.ok) {
    return assigned;
  }
  nextWiring = { ...nextWiring, terminals: assigned.value };
  terminals = [...assigned.value];
  const keys = getWiringKeys(project, nextWiring, cells);
  const connections = getWiringConnections(nextWiring, cells);
  let terminalIds = terminals.map((terminal) => terminal.id);
  terminalIds = getAffectedTerminalIds(project, input, { wiring, connections, terminalIds });
  if (nextWiring.kind === 'matrix' && ['auto', 'topology', 'mode'].includes(input.kind)) {
    return routeMatrixWiring({ ...project, keys, wiring: nextWiring }, connections);
  }
  return routeWiring(
    { ...project, keys, wiring: nextWiring },
    {
      connections: connections.filter((connection) => terminalIds.includes(connection.terminalId)),
      terminalIds,
      replaceKeyNets: input.kind === 'auto',
      sourceProject: project,
    },
  );
}

function editPin(
  original: Project,
  project: Project & { readonly wiring: Wiring },
  input: Extract<WiringEdit, { kind: 'pin' }>,
): Result<Project, string> {
  const wiring = project.wiring;
  const terminals = wiring.terminals.map((terminal) => {
    if (terminal.id !== input.terminalId || terminal.kind === 'ground') {
      return terminal;
    }
    const { boardPin: previous, droppedBoardPin, ...rest } = terminal;
    if (previous === input.boardPin && droppedBoardPin === undefined) {
      return terminal;
    }
    return { ...rest, ...(input.boardPin === undefined ? {} : { boardPin: input.boardPin }) };
  });
  return {
    ok: true,
    value: terminals.every((terminal, index) => terminal === wiring.terminals[index])
      ? original
      : { ...project, wiring: { ...wiring, terminals } },
  };
}

function editDirection(
  original: Project,
  project: Project & { readonly wiring: Wiring },
  input: Extract<WiringEdit, { kind: 'direction' }>,
): Result<Project, string> {
  const wiring = project.wiring;
  if (input.direction === wiring.diodeDirection) {
    return { ok: true, value: original };
  }
  return {
    ok: true,
    value: {
      ...project,
      wiring: { ...wiring, diodeDirection: input.direction },
      keys: project.keys.map((key) =>
        key.diode === undefined
          ? key
          : {
              ...key,
              diode: {
                ...key.diode,
                cathode: key.diode.cathode === 'away-switch' ? 'toward-switch' : 'away-switch',
              },
            },
      ),
    },
  };
}

function getWiringKeys(project: Project, nextWiring: Wiring, cells: readonly WiringCell[]) {
  return project.keys.map((key) => {
    const cell = cells.find((entry) => entry.keyId === key.id);
    const { diode: _diode, half: _oldHalf, ...rest } = key;
    return {
      ...rest,
      ...(nextWiring.topology === 'split' ? { half: cell?.half ?? 'left' } : {}),
      ...(nextWiring.kind === 'matrix'
        ? {
            diode: {
              pin: cell?.rowPin ?? 1,
              cathode:
                nextWiring.diodeDirection === 'col2row'
                  ? ('away-switch' as const)
                  : ('toward-switch' as const),
            },
          }
        : {}),
    };
  });
}

function prepareCells(
  project: Project & { readonly wiring: Wiring },
  input: WiringEdit,
): Result<{ cells: readonly WiringCell[]; wiring: Wiring } | undefined, string> {
  const wiring = project.wiring;
  let cells = getWiringCells(project);
  const nextWiring = wiring;
  if (input.kind === 'cell') {
    if (
      ![input.row, input.col].every((value) => Number.isInteger(value) && value >= 0 && value < 255)
    ) {
      return { ok: false, error: 'Row and column must be integers from 0 to 254.' };
    }
    const before = cells.find((cell) => cell.keyId === input.keyId);
    if (before?.row === input.row && before.col === input.col && before.half === input.half) {
      return { ok: true, value: undefined };
    }
    cells = cells.map((cell) =>
      cell.keyId === input.keyId
        ? { ...cell, row: input.row, col: input.col, half: input.half }
        : cell,
    );
  }
  if (input.kind === 'mode' || input.kind === 'topology' || input.kind === 'auto') {
    return prepareAutoCells(project, input);
  }
  if (input.kind === 'dimensions' && !dimensionsFit(cells, input)) {
    return { ok: false, error: 'Dimensions must be 1–255 and include every occupied cell.' };
  }
  return { ok: true, value: { cells, wiring: nextWiring } };
}

function prepareAutoCells(
  project: Project & { readonly wiring: Wiring },
  input: Extract<WiringEdit, { kind: 'mode' | 'topology' | 'auto' }>,
): Result<{ cells: readonly WiringCell[]; wiring: Wiring } | undefined, string> {
  const wiring = project.wiring;
  let nextWiring = wiring;
  let cells: readonly WiringCell[] = [];

  if (input.kind === 'mode') {
    if (input.mode === wiring.kind) {
      return { ok: true, value: undefined };
    }
    nextWiring = { ...wiring, kind: input.mode };
  }
  if (input.kind === 'topology') {
    if (input.topology === wiring.topology) {
      return { ok: true, value: undefined };
    }
    if (input.topology === 'split' && !input.board.ble) {
      return { ok: false, error: 'Split requires a Bluetooth controller.' };
    }
    nextWiring = { ...wiring, topology: input.topology };
  }
  cells = autoAssignCells(project, {
    topology: nextWiring.topology,
    gridStepU: input.kind === 'auto' ? input.gridStepU : 0.25,
    assignHalves: input.kind === 'topology',
  });
  if (nextWiring.kind === 'direct') {
    cells = toDirectCells(cells);
  }
  return { ok: true, value: { cells, wiring: nextWiring } };
}

function dimensionsFit(
  cells: readonly WiringCell[],
  input: Extract<WiringEdit, { kind: 'dimensions' }>,
) {
  return (
    [input.rows, input.cols].every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 255,
    ) &&
    !cells.some(
      (cell) =>
        cell.half === input.half &&
        ((cell.row ?? 0) >= input.rows || (cell.col ?? 0) >= input.cols),
    )
  );
}

function toDirectCells(cells: readonly WiringCell[]): readonly WiringCell[] {
  return cells.map((cell) => ({
    ...cell,
    row: 0,
    col: cells
      .filter((other) => other.half === cell.half)
      .findIndex((other) => other.keyId === cell.keyId),
    rowPin: 1,
  }));
}

function hasSameDimensions(wiring: Wiring, input: Extract<WiringEdit, { kind: 'dimensions' }>) {
  const terminals = wiring.terminals.filter((terminal) => terminal.half === input.half);
  const rowCount =
    wiring.kind === 'direct' ? 1 : terminals.filter((terminal) => terminal.kind === 'row').length;
  const colKind = wiring.kind === 'direct' ? 'input' : 'col';
  return (
    rowCount === input.rows &&
    terminals.filter((terminal) => terminal.kind === colKind).length === input.cols
  );
}

function getAffectedTerminalIds(
  project: Project,
  input: WiringEdit,
  context: {
    readonly wiring: Wiring;
    readonly connections: readonly WiringConnection[];
    readonly terminalIds: readonly string[];
  },
) {
  const { wiring, connections } = context;
  let terminalIds = [...context.terminalIds];
  if (input.kind === 'cell') {
    const oldConnections = getWiringConnections(wiring, getWiringCells(project));
    terminalIds = [
      ...new Set(
        [...oldConnections, ...connections]
          .filter((connection) => connection.keyId === input.keyId)
          .map((connection) => connection.terminalId),
      ),
    ];
  }
  return terminalIds;
}
