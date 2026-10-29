import { roundU } from '@domain/geometry';
import { getRoutingSettings } from '@domain/wiring';
import { getKeyPinPosition } from '@domain/wires/geometry';
import type { Half, Project, Wire, WirePoint } from '@domain';
import type { WiringConnection } from './route-wiring';
import type { SymmetricRouteInput } from './symmetric-route-types';
import { getRoutingSegments } from './routing-segments';
import { findSymmetricRoute } from './find-symmetric-route';

type DirectConstraints = Omit<SymmetricRouteInput, 'points'> & {
  readonly occupiedOutputs: readonly WirePoint[];
};

/** Terminal identity joins GND electrically; every drawn lead remains separate. */
export function findDirectRoute(
  project: Project,
  connection: WiringConnection,
  input: { readonly id: string; readonly wires: readonly Wire[] },
): Wire | undefined {
  const key = project.keys.find((entry) => entry.id === connection.keyId);
  const terminal = project.wiring?.terminals.find((entry) => entry.id === connection.terminalId);
  if (key === undefined || terminal === undefined) {
    return undefined;
  }
  const half = key.half ?? 'left';
  const points = localPath(getKeyPinPosition(key, connection.pin), {
    constraints: directConstraints(project, connection, { ...input, half }),
    ground: terminal.kind === 'ground',
  });
  const end = points?.at(-1);
  if (points === undefined || end === undefined) {
    return undefined;
  }
  return {
    id: input.id,
    half,
    start: { kind: 'key-pin', keyId: key.id, pin: connection.pin },
    end: { kind: 'free', at: end, terminalId: terminal.id },
    bends: points.slice(1, -1),
  };
}
function directConstraints(
  project: Project,
  connection: WiringConnection,
  input: { readonly half: Half; readonly id: string; readonly wires: readonly Wire[] },
): DirectConstraints {
  const settings = getRoutingSettings(project);
  const obstacles = getRoutingSegments({ ...project, wires: input.wires }).map((segment) => ({
    id: segment.id,
    from: segment.from,
    to: segment.to,
    half: input.half,
    netId: segment.wireId,
  }));
  const forbiddenPoints = project.keys.flatMap((key) =>
    ([1, 2] as const)
      .filter((pin) => key.id !== connection.keyId || pin !== connection.pin)
      .map((pin) => getKeyPinPosition(key, pin)),
  );
  const occupiedOutputs = input.wires.flatMap((wire) =>
    [wire.start, wire.end].flatMap((end) => (end.kind === 'free' ? [end.at] : [])),
  );
  return {
    occupiedOutputs,
    half: input.half,
    netId: input.id,
    outward: input.half === 'right' ? 'right' : 'left',
    clearanceU: Math.max(0.1, settings.clearanceU),
    pinClearanceU: Math.max(0.3, settings.clearanceU),
    offsetU: Math.max(0.15, settings.offsetU),
    obstacles,
    forbiddenPoints,
  };
}
function localPath(
  start: WirePoint,
  input: {
    readonly constraints: DirectConstraints;
    readonly ground: boolean;
  },
): readonly WirePoint[] | undefined {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const points = candidatePoints(start, {
      attempt,
      ground: input.ground,
      right: input.constraints.half === 'right',
    });
    const end = points.at(-1);
    const minimum = Math.max(0.3, input.constraints.clearanceU);
    if (
      end === undefined ||
      [...input.constraints.occupiedOutputs, ...(input.constraints.forbiddenPoints ?? [])].some(
        (point) => Math.hypot(point.xU - end.xU, point.yU - end.yU) < minimum - 1e-8,
      )
    ) {
      continue;
    }
    const found = findSymmetricRoute({ ...input.constraints, points });
    if (found.ok) {
      return found.value.points;
    }
  }
  return undefined;
}
function candidatePoints(
  start: WirePoint,
  input: {
    readonly attempt: number;
    readonly ground: boolean;
    readonly right: boolean;
  },
): readonly WirePoint[] {
  if (input.attempt === 0) {
    const dx = (input.ground ? 0.15 : -0.3) * (input.right ? -1 : 1);
    const dy = input.ground ? 0.5 : -0.3;
    const end = { xU: roundU(start.xU + dx), yU: roundU(start.yU + dy) };
    return [start, { xU: end.xU, yU: start.yU }, end];
  }
  return [start, output(start, { ...input, attempt: input.attempt - 1 })];
}
function output(
  start: WirePoint,
  input: {
    readonly attempt: number;
    readonly ground: boolean;
    readonly right: boolean;
  },
): WirePoint {
  const distance = 0.75 + Math.floor(input.attempt / 4) * 0.15;
  const directions = input.ground
    ? [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]
    : [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];
  const direction = directions[input.attempt % 4] ?? [0, -1];
  return {
    xU: roundU(start.xU + (direction[0] ?? 0) * distance * (input.right ? -1 : 1)),
    yU: roundU(start.yU + (direction[1] ?? 0) * distance),
  };
}
