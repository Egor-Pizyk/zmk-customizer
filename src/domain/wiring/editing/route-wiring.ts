import { validateWireProtection } from '@domain/wires/protection';
import { findWireContacts } from '@domain/wires/contacts';
import { getKeyPinWires, captureWireContacts } from '@domain/wires';
import { createEntityId, getProjectResourceError, PROJECT_BUDGET } from '@domain/project';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { getNets } from '@domain/wires/nets';
import { findDirectRoute } from './find-direct-route';
import { getOutputPosition } from './get-output-position';
import { getRetainedWires } from './get-retained-wires';
import type { Key, KeyPin, Project, Result, Wire, WirePoint } from '@domain';

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

function routeWiringCandidate(
  project: Project,
  input: {
    readonly connections: readonly WiringConnection[];
    readonly terminalIds: readonly string[];
    readonly replaceKeyNets?: boolean;
    readonly sourceProject?: Project;
    readonly retainAllWires?: boolean;
  },
): Result<Project, string> {
  const wires = getStartingWires(project, input);
  const existingIds = project.wires.map((wire) => wire.id);
  const routeError = appendRoutes(project, input.connections, { wires, existingIds });
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
        (project.wiring?.kind === 'direct' || findTerminalId(first) !== findTerminalId(second))
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
  context: { wires: Wire[]; existingIds: string[] },
): string | undefined {
  const { wires, existingIds } = context;
  for (const [index, connection] of connections.entries()) {
    const currentNet = getNets({ ...project, wires }).find((net) =>
      net.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
    );
    if (currentNet?.terminalIds.includes(connection.terminalId) === true) {
      continue;
    }
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
    });
    if (routed === undefined) {
      return `Cannot route key ${project.keys.indexOf(key)} without shorting different buses. Move the key slightly or repair its wires, then retry.`;
    }
    wires.push(routed);
  }

  return undefined;
}

function findRoute(
  project: Project,
  connection: WiringConnection,
  context: FindRouteInput,
): Wire | undefined {
  if (project.wiring?.kind === 'direct') {
    return findDirectRoute(project, connection, context);
  }
  const { key, terminalId, id, index, wires } = context;
  const output = findOutput(project, { terminalId, wires });
  if (output === undefined) {
    return undefined;
  }
  const start = getKeyPinPosition(key, connection.pin);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { xU, yU } = output;
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
    if (!hasOverlap && !touchesOtherPin(project, candidate, connection)) {
      return candidate;
    }
  }

  return undefined;
}

type FindRouteInput = {
  key: Key;
  terminalId: string;
  id: string;
  index: number;
  wires: Wire[];
};

function touchesOtherPin(project: Project, wire: Wire, connection: WiringConnection) {
  const findWires = getKeyPinWires({ ...project, wires: [captureWireContacts(project, wire)] });
  return project.keys.some((key) =>
    ([1, 2] as const).some(
      (pin) =>
        (key.id !== connection.keyId || pin !== connection.pin) &&
        findWires({ keyId: key.id, pin }).length > 0,
    ),
  );
}

function getStartingWires(
  project: Project,
  input: {
    readonly terminalIds: readonly string[];
    readonly replaceKeyNets?: boolean;
    readonly sourceProject?: Project;
    readonly retainAllWires?: boolean;
  },
): Wire[] {
  if (input.retainAllWires === true) {
    return [...project.wires];
  }
  if (input.replaceKeyNets === true) {
    return [...getRetainedWires(input.sourceProject ?? project)];
  }
  if (project.wiring?.terminals.length === input.terminalIds.length) {
    return [];
  }
  const removedIds = new Set(
    getNets(input.sourceProject ?? project)
      .filter((net) => net.terminalIds.some((id) => input.terminalIds.includes(id)))
      .flatMap((net) => net.wireIds),
  );
  return project.wires.filter((wire) => !removedIds.has(wire.id));
}

function findOutput(
  project: Project,
  input: { readonly terminalId: string; readonly wires: readonly Wire[] },
): WirePoint | undefined {
  for (const wire of input.wires) {
    for (const end of [wire.start, wire.end]) {
      if (end.kind === 'free' && end.terminalId === input.terminalId) {
        return end.at;
      }
    }
  }
  const terminal = project.wiring?.terminals.find((entry) => entry.id === input.terminalId);
  if (terminal === undefined) {
    return undefined;
  }
  const index =
    project.wiring?.terminals
      .filter((entry) => entry.half === terminal.half && entry.kind === terminal.kind)
      .findIndex((entry) => entry.id === terminal.id) ?? 0;
  const occupied = input.wires.flatMap((wire) =>
    [wire.start, wire.end].flatMap((end) =>
      end.kind === 'free' && end.terminalId !== terminal.id ? [end.at] : [],
    ),
  );
  const output = getOutputPosition(project, { terminal, index, occupied });
  return output.ok ? output.value : undefined;
}

export function routeWiring(
  project: Project,
  input: Parameters<typeof routeWiringCandidate>[1],
): Result<Project, string> {
  const result = routeWiringCandidate(project, input);
  if (!result.ok) {
    return result;
  }
  const issue = validateWireProtection(project, result.value)[0];
  return issue === undefined ? result : { ok: false, error: issue.message };
}
