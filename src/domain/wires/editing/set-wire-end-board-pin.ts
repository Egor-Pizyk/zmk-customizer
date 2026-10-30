import { preserveWireProtection } from '@domain/wires/protection';
import type { Project, WireEnd, WireEndSide } from '@domain';

function withBoardPin(end: WireEnd, boardPin: number | undefined, ground = false): WireEnd {
  if (end.kind !== 'free') {
    return end;
  }
  if (ground) {
    return { kind: 'free', at: end.at, ground: true };
  }
  return boardPin === undefined
    ? { kind: 'free', at: end.at }
    : { kind: 'free', at: end.at, boardPin };
}

function setWireEndBoardPinCandidate(
  project: Project,
  input: {
    readonly wireId: string;
    readonly side: WireEndSide;
    readonly boardPin: number | undefined;
    readonly ground?: boolean;
  },
): Project {
  const end = project.wires.find((wire) => wire.id === input.wireId)?.[input.side];
  if (end?.kind === 'free' && end.terminalId !== undefined && project.wiring !== undefined) {
    const terminals = project.wiring.terminals.map((terminal) => {
      if (terminal.id !== end.terminalId || terminal.kind === 'ground') {
        return terminal;
      }
      const { boardPin: _oldPin, droppedBoardPin: _dropped, ...rest } = terminal;
      return { ...rest, ...(input.boardPin === undefined ? {} : { boardPin: input.boardPin }) };
    });
    return { ...project, wiring: { ...project.wiring, terminals } };
  }
  const wires = project.wires.map((wire) =>
    wire.id === input.wireId
      ? { ...wire, [input.side]: withBoardPin(wire[input.side], input.boardPin, input.ground) }
      : wire,
  );
  return { ...project, wires };
}

export function setWireEndBoardPin(
  project: Project,
  input: Parameters<typeof setWireEndBoardPinCandidate>[1],
): Project {
  return preserveWireProtection(project, setWireEndBoardPinCandidate(project, input));
}
