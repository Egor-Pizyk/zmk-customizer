import { createEntityId, getProjectResourceError, PROJECT_BUDGET } from '@domain/project';
import { findWireContacts, getKeyPinPosition } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import type { Key, KeyPin, Project, Result, Wire } from '@domain';

export type WiringConnection = {
  readonly keyId: string;
  readonly pin: KeyPin;
  readonly terminalId: string;
};

function findTerminalId(wire: Wire): string | undefined {
  for (const end of [wire.start, wire.end]) {
    if (end.kind === 'free' && end.terminalId !== undefined) {
      return end.terminalId;
    }
  }
  return undefined;
}

export function routeWiring(
  project: Project,
  input: {
    readonly connections: readonly WiringConnection[];
    readonly terminalIds: readonly string[];
  },
): Result<Project, string> {
  const removedIds = new Set(
    getNets(project)
      .filter((net) => net.terminalIds.some((id) => input.terminalIds.includes(id)))
      .flatMap((net) => net.wireIds),
  );
  // Initializing an incomplete circuit replaces its old routes explicitly in the preview.
  const wires: Wire[] =
    project.wiring?.terminals.length === input.terminalIds.length
      ? []
      : project.wires.filter((wire) => !removedIds.has(wire.id));
  const existingIds = project.wires.map((wire) => wire.id);
  const { minX, minY } = getRoutingBounds(project);
  const routeError = appendRoutes(project, input.connections, { wires, existingIds, minX, minY });
  if (routeError !== undefined) {
    return { ok: false, error: routeError };
  }
  if (wires.length > PROJECT_BUDGET.wires) {
    return {
      ok: false,
      error: `Routing exceeds ${PROJECT_BUDGET.wires} wires. Simplify the circuit.`,
    };
  }
  const candidate = { ...project, wires };
  const insulatedCrossings = getRouteInsulation(project, candidate);
  if (insulatedCrossings.length > PROJECT_BUDGET.crossings) {
    return { ok: false, error: 'Routing exceeds the crossing limit. Simplify the circuit.' };
  }
  const routedProject = { ...candidate, insulatedCrossings };
  const resourceError = getProjectResourceError(routedProject);
  if (resourceError !== undefined) {
    return { ok: false, error: resourceError };
  }
  return finishRoutes(routedProject, input.connections);
}

function finishRoutes(
  routedProject: Project,
  connections: readonly WiringConnection[],
): Result<Project, string> {
  if (!connectionsMatch(routedProject, connections)) {
    return {
      ok: false,
      error:
        'The proposed routes connect different buses. Repair the affected wires before applying.',
    };
  }
  return { ok: true, value: routedProject };
}

function getRoutingBounds(project: Project) {
  const allPins = project.keys.flatMap((key) => [
    getKeyPinPosition(key, 1),
    getKeyPinPosition(key, 2),
  ]);
  let minX = 0;
  let minY = 0;
  for (const pin of allPins) {
    minX = Math.min(minX, pin.xU);
    minY = Math.min(minY, pin.yU);
  }

  return { minX, minY };
}

function getRouteInsulation(project: Project, candidate: Project) {
  const wires = candidate.wires;
  const contacts = findWireContacts(candidate);
  const wireIds = new Set(wires.map((wire) => wire.id));
  const oldInsulation = project.insulatedCrossings.filter((ref) =>
    ref.wireIds.every((id) => wireIds.has(id)),
  );
  const newInsulation = contacts.crossings
    .filter((crossing) => {
      const first = wires.find((wire) => wire.id === crossing.wireIds[0]);
      const second = wires.find((wire) => wire.id === crossing.wireIds[1]);
      return (
        first !== undefined &&
        second !== undefined &&
        findTerminalId(first) !== findTerminalId(second)
      );
    })
    .map(({ wireIds: ids, ordinal }) => ({ wireIds: ids, ordinal }));
  const insulatedCrossings = [...oldInsulation, ...newInsulation].filter(
    (ref, index, all) =>
      all.findIndex(
        (other) =>
          other.ordinal === ref.ordinal &&
          other.wireIds[0] === ref.wireIds[0] &&
          other.wireIds[1] === ref.wireIds[1],
      ) === index,
  );

  return insulatedCrossings;
}

function connectionsMatch(routedProject: Project, connections: readonly WiringConnection[]) {
  const routedNets = getNets(routedProject);
  for (const connection of connections) {
    const net = routedNets.find((entry) =>
      entry.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
    );
    if (net?.terminalIds.length !== 1 || !net.terminalIds.includes(connection.terminalId)) {
      return false;
    }
  }

  return true;
}

function appendRoutes(
  project: Project,
  connections: readonly WiringConnection[],
  context: { wires: Wire[]; existingIds: string[]; minX: number; minY: number },
): string | undefined {
  const { wires, existingIds, minX, minY } = context;
  for (const [index, connection] of connections.entries()) {
    const key = project.keys.find((entry) => entry.id === connection.keyId);
    const terminal = project.wiring?.terminals.find((entry) => entry.id === connection.terminalId);
    if (key === undefined || terminal === undefined) {
      return 'A wiring connection references a missing key or terminal.';
    }
    const id = createEntityId({ prefix: 'w', existingIds });
    existingIds.push(id);
    const routed = findRoute(project, connection, {
      key,
      terminalId: terminal.id,
      id,
      index,
      wires,
      minX,
      minY,
    });
    if (routed === undefined) {
      return `Cannot route key ${project.keys.indexOf(key)} without shorting different buses. Move the key slightly or repair its wires, then retry.`;
    }
    wires.push(routed);
  }

  return undefined;
}

function findRoute(project: Project, connection: WiringConnection, context: FindRouteInput) {
  const { key, terminalId, id, index, wires, minX, minY } = context;
  const start = getKeyPinPosition(key, connection.pin);
  let routed: Wire | undefined;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const xU = minX - 1 - index * 0.07 - attempt * 0.03;
    const yU = minY - 1 - index * 0.09 - attempt * 0.04;
    const escapeY =
      start.yU + (0.01 + index * 0.0001 + attempt * 0.001) * (attempt % 2 === 0 ? 1 : -1);
    const candidate: Wire = {
      id,
      start: { kind: 'key-pin', keyId: key.id, pin: connection.pin },
      end: { kind: 'free', at: { xU, yU }, terminalId },
      bends: [
        { xU: start.xU, yU: escapeY },
        { xU, yU: escapeY },
      ],
    };
    const contacts = findWireContacts({ ...project, wires: [...wires, candidate] });
    const hasOverlap = contacts.overlaps.some(
      (pair) =>
        pair.includes(id) &&
        wires.some((wire) => pair.includes(wire.id) && findTerminalId(wire) !== terminalId),
    );
    if (!hasOverlap) {
      routed = candidate;
      break;
    }
  }

  return routed;
}

type FindRouteInput = {
  key: Key;
  terminalId: string;
  id: string;
  index: number;
  wires: Wire[];
  minX: number;
  minY: number;
};
