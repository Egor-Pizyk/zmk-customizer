import type { Net } from '@domain/wires/nets';
import type { WiringConnection } from './route-wiring';
import { getNets } from '@domain/wires/nets';
import { getWiringConnections } from '@domain/wiring';
import type { WiringCell } from '@domain/wiring/matrix';
import type { Project, Result, Wiring, WiringTerminal } from '@domain';

type Input = {
  readonly terminals: readonly WiringTerminal[];
  readonly cells: readonly WiringCell[];
  readonly pinIds: readonly string[];
};

/** Read known hardware assignments from the source before selected conductors are replaced. */
export function preserveManualRoutingPins(
  project: Project & { readonly wiring: Wiring },
  input: Input,
): Result<readonly WiringTerminal[], string> {
  const connections = getWiringConnections(
    { ...project.wiring, terminals: input.terminals },
    input.cells,
  ).filter((connection) => input.pinIds.includes(`${connection.keyId}:${connection.pin}`));
  let terminals = input.terminals;
  for (const net of getNets(project)) {
    if (net.terminalIds.length > 0 || net.boardPins.length === 0) {
      continue;
    }
    const intended = intendedTerminals(net, connections);
    if (intended.size === 0) {
      continue;
    }
    const pins = [...new Set(net.boardPins.map((contact) => contact.boardPin))];
    const terminalId = [...intended][0];
    const pin = pins[0];
    const terminal = terminals.find((entry) => entry.id === terminalId);
    if (
      intended.size !== 1 ||
      pins.length !== 1 ||
      pin === undefined ||
      terminal === undefined ||
      (terminal.boardPin !== undefined && terminal.boardPin !== pin)
    ) {
      return {
        ok: false,
        error:
          'A manual GPIO circuit conflicts with the requested matrix cells. Repair its assignments before generating.',
      };
    }
    terminals = terminals.map((entry) => assignedTerminal(entry, { id: terminal.id, pin }));
  }
  return { ok: true, value: terminals };
}

function assignedTerminal(
  terminal: WiringTerminal,
  input: { readonly id: string; readonly pin: number },
): WiringTerminal {
  return terminal.id === input.id ? { ...terminal, boardPin: input.pin } : terminal;
}

function intendedTerminals(
  net: Net,
  connections: readonly WiringConnection[],
): ReadonlySet<string> {
  return new Set(
    connections
      .filter((connection) =>
        net.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
      )
      .map((connection) => connection.terminalId),
  );
}
