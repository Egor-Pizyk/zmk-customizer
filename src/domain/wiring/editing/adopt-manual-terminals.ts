import type { Project, Result, Wiring } from '@domain';
import { getNets } from '@domain/wires/nets';
import type { WiringConnection } from './route-wiring';

// Resolve raw GPIO endpoints against the intended cells before allocating any new pins.
export function adoptManualTerminals(
  project: Project & { readonly wiring: Wiring },
  connections: readonly WiringConnection[],
): Result<Project & { readonly wiring: Wiring }, string> {
  let candidate = project;
  for (const net of getNets(project)) {
    if (net.boardPins.length === 0 || net.terminalIds.length > 0 || net.pins.length === 0) {
      continue;
    }
    const desired = getDesiredTerminals(net, connections);
    const pins = new Set(net.boardPins.map((contact) => contact.boardPin));
    const terminalId = [...desired][0];
    const boardPin = [...pins][0];
    const terminal = candidate.wiring.terminals.find((entry) => entry.id === terminalId);
    if (
      desired.size !== 1 ||
      pins.size !== 1 ||
      terminal === undefined ||
      terminal.kind === 'ground' ||
      boardPin === undefined ||
      (terminal.boardPin !== undefined && terminal.boardPin !== boardPin)
    ) {
      return {
        ok: false,
        error:
          'A manual GPIO circuit conflicts with the assigned cells. Repair its connections before completing.',
      };
    }
    candidate = adoptCircuit(candidate, {
      terminalId: terminal.id,
      boardPin,
      wireIds: net.wireIds,
    });
  }
  return { ok: true, value: candidate };
}

function adoptEnd(end: Project['wires'][number]['start'], belongs: boolean, terminalId: string) {
  return belongs && end.kind === 'free' && end.boardPin !== undefined
    ? { kind: 'free' as const, at: end.at, terminalId }
    : end;
}

function adoptCircuit(
  candidate: Project & { readonly wiring: Wiring },
  {
    terminalId,
    boardPin,
    wireIds,
  }: {
    readonly terminalId: string;
    readonly boardPin: number;
    readonly wireIds: readonly string[];
  },
): Project & { readonly wiring: Wiring } {
  return {
    ...candidate,
    wiring: {
      ...candidate.wiring,
      terminals: candidate.wiring.terminals.map((entry) =>
        entry.id === terminalId ? { ...entry, boardPin } : entry,
      ),
    },
    wires: candidate.wires.map((wire) => ({
      ...wire,
      start: adoptEnd(wire.start, wireIds.includes(wire.id), terminalId),
      end: adoptEnd(wire.end, wireIds.includes(wire.id), terminalId),
    })),
  };
}

function getDesiredTerminals(
  net: ReturnType<typeof getNets>[number],
  connections: readonly WiringConnection[],
) {
  return new Set(
    connections
      .filter((connection) =>
        net.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
      )
      .map((connection) => connection.terminalId),
  );
}
