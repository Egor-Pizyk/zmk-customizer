import { getRoutingSettings, getWiringConnections } from '@domain/wiring';
import type { WiringCell } from '@domain/wiring/matrix';
import type { Project, Result, Wiring } from '@domain';
import { getRetainedWires } from './get-retained-wires';
import { routeRegeneration } from './route-matrix-buses';
import { finishRegeneration } from './finish-regeneration';

import type { WiringEdit } from './wiring-edit';
import { getWiringCells } from '@domain/wiring/matrix';
import { routeWiring } from './route-wiring';

export function routeAssignedWiring(
  base: Project,
  edit: WiringEdit,
  input: {
    readonly candidate: Project & { readonly wiring: Wiring };
    readonly cells: readonly WiringCell[];
  },
): Result<Project, string> {
  const { candidate, cells } = input;
  if (candidate.wiring.kind === 'matrix' && ['mode', 'topology', 'auto'].includes(edit.kind)) {
    return routeAssignedMatrix({ base, ...input });
  }
  const connections = getWiringConnections(candidate.wiring, cells);
  let terminalIds = candidate.wiring.terminals.map((terminal) => terminal.id);
  if (edit.kind === 'cell') {
    const oldConnections = getWiringConnections(
      base.wiring ?? candidate.wiring,
      getWiringCells(base),
    );
    terminalIds = [
      ...new Set(
        [...oldConnections, ...connections]
          .filter((connection) => connection.keyId === edit.keyId)
          .map((connection) => connection.terminalId),
      ),
    ];
  }
  return routeWiring(candidate, {
    connections: connections.filter((connection) => terminalIds.includes(connection.terminalId)),
    terminalIds,
    replaceKeyNets: edit.kind === 'auto',
    sourceProject: base,
  });
}

/** Whole-mode/auto operations use the same bus geometry as Generate. */
function routeAssignedMatrix(input: {
  readonly base: Project;
  readonly candidate: Project & { readonly wiring: Wiring };
  readonly cells: readonly WiringCell[];
}): Result<Project, string> {
  const { base, candidate, cells } = input;
  const settings = getRoutingSettings(candidate);
  const connections = getWiringConnections(candidate.wiring, cells);
  const keyIds = [...new Set(connections.map((connection) => connection.keyId))];
  const pinIds = connections.map((connection) => `${connection.keyId}:${connection.pin}`);
  const routed = routeRegeneration(
    { ...candidate, routing: settings, wires: getRetainedWires(base) },
    {
      cells,
      settings,
      keyIds,
      pinIds,
      existingIds: base.wires.map((wire) => wire.id),
    },
  );
  if (!routed.ok) {
    return routed;
  }
  const finished = finishRegeneration(base, routed.value.project, { cells, keyIds, pinIds });
  return finished.ok ? finished : { ok: false, error: finished.error.message };
}
