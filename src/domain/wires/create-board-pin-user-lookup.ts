import { getWireHalf } from '@domain/wires/geometry';
import type { Half, Project, WireEndSide } from '@domain';

export type BoardPinUserQuery = {
  readonly boardPin: number;
  readonly except: { readonly wireId: string; readonly side: WireEndSide };
};
type User = {
  readonly wireId: string;
  readonly index: number;
  readonly side: WireEndSide;
  readonly terminalId: string | undefined;
};

type WireAssignment = {
  readonly half: Half;
  readonly terminals: Partial<Record<WireEndSide, string>>;
};

/** Immutable derived lookup; excludes only the requested end and its shared terminal. */
export function createBoardPinUserLookup(project: Project) {
  const terminals = new Map(project.wiring?.terminals.map((terminal) => [terminal.id, terminal]));
  const wires = new Map<string, WireAssignment>();
  const users = new Map<string, User[]>();
  for (const [index, wire] of project.wires.entries()) {
    const half = getWireHalf(project, wire);
    const attached: Partial<Record<WireEndSide, string>> = {};
    for (const side of ['start', 'end'] as const) {
      const end = wire[side];
      if (end.kind !== 'free') {
        continue;
      }
      if (end.terminalId !== undefined) {
        attached[side] = end.terminalId;
      }
      const terminal = end.terminalId === undefined ? undefined : terminals.get(end.terminalId);
      const boardPin = terminal?.boardPin ?? end.boardPin;
      if (boardPin !== undefined) {
        const key = `${half}:${boardPin}`;
        const bucket = users.get(key) ?? [];
        bucket.push({ wireId: wire.id, index, side, terminalId: end.terminalId });
        users.set(key, bucket);
      }
    }
    wires.set(wire.id, { half, terminals: attached });
  }
  return (input: BoardPinUserQuery): number | undefined => {
    const wire = wires.get(input.except.wireId);
    const terminalId = wire?.terminals[input.except.side];
    return users
      .get(`${wire?.half ?? 'left'}:${input.boardPin}`)
      ?.find(
        (user) =>
          !(user.wireId === input.except.wireId && user.side === input.except.side) &&
          (user.terminalId === undefined || user.terminalId !== terminalId),
      )?.index;
  };
}
