import { getProjectResourceError, PROJECT_BUDGET } from '@domain/project';
import { findWireContacts } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getKeyPinPosition } from '@domain/wires/geometry';
import type { Project, Result, WirePoint } from '@domain';
import { getRetainedWires } from './get-retained-wires';
import { getGroupedOutputPositions } from './get-grouped-output-positions';
import { getMatrixRouteContext } from './get-matrix-route-context';
import { routeMatrixTree } from './route-matrix-tree';
import type { WiringConnection } from './route-wiring';

const WIRE_BUDGET_ERROR = 'Routing exceeds 600 wires. Simplify retained wiring before rebuilding.';

export function routeMatrixWiring(
  project: Project,
  connections: readonly WiringConnection[],
): Result<Project, string> {
  const wires = [...getRetainedWires(project)];
  if (wires.length + connections.length > PROJECT_BUDGET.wires) {
    return { ok: false, error: WIRE_BUDGET_ERROR };
  }
  const outputs = getGroupedOutputPositions(project);
  if (!outputs.ok) {
    return outputs;
  }
  const context = getMatrixRouteContext({ ...project, wires });
  context.pins.push(...outputs.value.map((output) => ({ id: output.terminalId, at: output.at })));
  context.areas.push(...getOutputAreas(project, outputs.value));
  for (const output of outputs.value) {
    const contacts = getContacts(
      project,
      connections.filter((entry) => entry.terminalId === output.terminalId),
    );
    if (!contacts.ok) {
      return contacts;
    }
    const error = routeMatrixTree(contacts.value, {
      ...context,
      wires,
      terminalId: output.terminalId,
      output: output.at,
    });
    if (error !== undefined) {
      return { ok: false, error };
    }
  }
  const candidate = { ...project, wires };
  const insulatedCrossings = getInsulation(candidate, context.labels);
  const result = { ...candidate, insulatedCrossings };
  const error = getProjectResourceError(result) ?? getConnectionError(result, connections);
  return error === undefined ? { ok: true, value: result } : { ok: false, error };
}

function getContacts(project: Project, connections: readonly WiringConnection[]) {
  const contacts = [];
  for (const connection of connections) {
    const key = project.keys.find((entry) => entry.id === connection.keyId);
    if (key === undefined) {
      return {
        ok: false as const,
        error:
          'A wiring connection references a missing key. Repair the project before rebuilding.',
      };
    }
    contacts.push({ ...connection, at: getKeyPinPosition(key, connection.pin) });
  }
  return { ok: true as const, value: contacts };
}

function getInsulation(project: Project, labels: ReadonlyMap<string, string>) {
  const wireIds = new Set(project.wires.map((wire) => wire.id));
  const old = project.insulatedCrossings.filter((ref) =>
    ref.wireIds.every((id) => wireIds.has(id)),
  );
  const extra = findWireContacts(project).crossings.filter(
    (crossing) => labels.get(crossing.wireIds[0]) !== labels.get(crossing.wireIds[1]),
  );
  return [...old, ...extra.map(({ wireIds: ids, ordinal }) => ({ wireIds: ids, ordinal }))].filter(
    (ref, index, all) =>
      all.findIndex(
        (other) =>
          other.ordinal === ref.ordinal &&
          other.wireIds[0] === ref.wireIds[0] &&
          other.wireIds[1] === ref.wireIds[1],
      ) === index,
  );
}

function getConnectionError(
  project: Project,
  connections: readonly WiringConnection[],
): string | undefined {
  const nets = getNets(project);
  for (const connection of connections) {
    const net = nets.find((entry) =>
      entry.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
    );
    if (
      net?.terminalIds.length !== 1 ||
      !net.terminalIds.includes(connection.terminalId) ||
      (net.encoderPins?.length ?? 0) > 0 ||
      net.pins.some(
        (pin) =>
          !connections.some(
            (entry) =>
              entry.keyId === pin.keyId &&
              entry.pin === pin.pin &&
              entry.terminalId === connection.terminalId,
          ),
      )
    ) {
      return 'The proposed routes join different matrix lines. Separate overlapping contacts and rebuild.';
    }
  }
  return undefined;
}

function getOutputAreas(
  project: Project,
  outputs: readonly { readonly terminalId: string; readonly at: WirePoint }[],
) {
  return outputs.map((output) => {
    const terminal = project.wiring?.terminals.find((entry) => entry.id === output.terminalId);
    const right = terminal?.half === 'right' && project.wiring?.topology === 'split';
    return {
      minX: output.at.xU + (right ? 0.1 : -4.2),
      maxX: output.at.xU + (right ? 4.2 : -0.1),
      minY: output.at.yU - 0.25,
      maxY: output.at.yU + 0.25,
    };
  });
}
