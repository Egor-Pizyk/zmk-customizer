import type { Project, WireEnd, WireEndSide } from './types';

function withBoardPin(end: WireEnd, boardPin: number | undefined): WireEnd {
  if (end.kind !== 'free') {
    return end;
  }
  return boardPin === undefined ? { kind: 'free', at: end.at } : { ...end, boardPin };
}

export function setWireEndBoardPin(
  project: Project,
  input: {
    readonly wireId: string;
    readonly side: WireEndSide;
    readonly boardPin: number | undefined;
  },
): Project {
  const wires = project.wires.map((wire) =>
    wire.id === input.wireId
      ? { ...wire, [input.side]: withBoardPin(wire[input.side], input.boardPin) }
      : wire,
  );
  return { ...project, wires };
}
