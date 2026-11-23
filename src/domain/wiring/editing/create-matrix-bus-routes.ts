import { getKeyCorners, roundU } from '@domain/geometry';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { getWiringConnections } from '@domain/wiring';
import type { Key, Project, Result, RoutingSettings } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';

import type { MatrixBusRoute, MatrixBusGroup as Group } from './matrix-bus-types';
import { createPreferredRowBus } from './matrix-row-bus';
import { compareGroups, sortedMembers, getIdentity, getRange } from './matrix-bus-order';

type Input = {
  readonly cells: readonly WiringCell[];
  readonly settings: RoutingSettings;
  readonly pinIds?: readonly string[];
};

/** Preferred geometry only: conflict search and electrical validation must precede any Apply. */
export function createMatrixBusRoutes(
  project: Project,
  input: Input,
): Result<readonly MatrixBusRoute[], string> {
  const failure = findInputFailure(project, input);
  if (failure !== undefined || project.wiring === undefined) {
    return { ok: false, error: failure ?? 'Configure matrix wiring before building buses.' };
  }
  const cells = input.cells.map((cell) => ({
    ...cell,
    rowPin: cell.rowPin ?? input.settings.rowPin ?? 1,
  }));
  const connections = getWiringConnections(project.wiring, cells);
  const expected = input.pinIds?.length ?? cells.length * 2;
  const scoped =
    input.pinIds === undefined
      ? connections
      : connections.filter(
          (connection) => input.pinIds?.includes(`${connection.keyId}:${connection.pin}`) === true,
        );
  if (scoped.length !== expected) {
    return { ok: false, error: 'A logical row or column has no corresponding matrix terminal.' };
  }
  const keys = new Map(project.keys.map((key) => [key.id, key]));
  const groups = getGroups(project, connections, keys).toSorted(compareGroups);
  const routes = groups.map((group) =>
    group.kind === 'row'
      ? createPreferredRowBus(group, groups, input.settings)
      : createColumnRoute(group, project, input.settings),
  );
  if (
    routes.some((route) =>
      route.line.some((point) => !Number.isFinite(point.xU) || !Number.isFinite(point.yU)),
    )
  ) {
    return { ok: false, error: 'Repair non-finite key geometry before building buses.' };
  }
  return { ok: true, value: routes };
}

function findInputFailure(project: Project, { cells, settings }: Input): string | undefined {
  if (project.wiring?.kind !== 'matrix') {
    return 'Bus routing requires matrix topology.';
  }
  if (
    [settings.offsetU, settings.clearanceU, settings.fallbackRowIntervalU].some(
      (value) => !Number.isFinite(value) || roundU(value) <= 0,
    )
  ) {
    return 'Bus offsets, clearance and fallback interval must be positive finite distances.';
  }
  const keys = new Map(project.keys.map((key) => [key.id, key]));
  if (new Set(cells.map((cell) => cell.keyId)).size !== cells.length) {
    return 'Each key must have one logical matrix assignment.';
  }
  const invalid = cells.find((cell) => {
    const key = keys.get(cell.keyId);
    return (
      key === undefined ||
      (key.half ?? 'left') !== cell.half ||
      !Number.isInteger(cell.row) ||
      !Number.isInteger(cell.col) ||
      cell.row === undefined ||
      cell.col === undefined ||
      cell.row < 0 ||
      cell.col < 0 ||
      cell.row > 254 ||
      cell.col > 254
    );
  });
  return invalid === undefined
    ? undefined
    : `Repair the logical assignment of key ${invalid.keyId} before routing.`;
}

function getGroups(
  project: Project,
  connections: ReturnType<typeof getWiringConnections>,
  keys: ReadonlyMap<string, Key>,
): Group[] {
  const wiring = project.wiring;
  if (wiring === undefined) {
    return [];
  }
  return wiring.terminals.flatMap((terminal) => {
    if (terminal.kind !== 'row' && terminal.kind !== 'col') {
      return [];
    }
    const members = connections
      .filter((connection) => connection.terminalId === terminal.id)
      .flatMap((connection) => {
        const key = keys.get(connection.keyId);
        return key === undefined
          ? []
          : [{ key, pin: connection.pin, at: getKeyPinPosition(key, connection.pin) }];
      });
    const index = wiring.terminals
      .filter((entry) => entry.half === terminal.half && entry.kind === terminal.kind)
      .indexOf(terminal);
    const group: Group = {
      terminalId: terminal.id,
      half: terminal.half,
      kind: terminal.kind,
      index,
      members,
    };
    return members.length === 0 ? [] : [group];
  });
}

function createColumnRoute(
  group: Group,
  project: Project,
  settings: RoutingSettings,
): MatrixBusRoute {
  const xs = group.members.map((member) => member.at.xU);
  const first = xs[0] ?? 0;
  const extreme =
    group.half === 'right'
      ? getRange(xs).max + settings.offsetU
      : getRange(xs).min - settings.offsetU;
  const xU = xs.every((value) => value === first) ? first : roundU(extreme);
  const ys = group.members.map((member) => member.at.yU);
  const corners = project.keys
    .filter((key) => (key.half ?? 'left') === group.half)
    .flatMap((key) => getKeyCorners(key));
  const top = getRange([...corners.map((point) => point.yU), ...ys]).min;
  return {
    ...getIdentity(group),
    line: [
      { xU, yU: roundU(top - settings.offsetU) },
      { xU, yU: getRange(ys).max },
    ],
    branches: sortedMembers(group).map((member) => ({
      keyId: member.key.id,
      pin: member.pin,
      pinAt: member.at,
      busAt: { xU, yU: member.at.yU },
      requiresDetour: false,
    })),
  };
}
