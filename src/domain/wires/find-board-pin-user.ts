import { getWireHalf } from '@domain/wires/geometry';
import type { Project, WireEndSide } from '@domain';

const SIDES: readonly WireEndSide[] = ['start', 'end'];

/** Index of the first wire whose free end uses `boardPin`, other than `except` (FR-020). */
export function findBoardPinUser(
  project: Project,
  input: {
    readonly boardPin: number;
    readonly except: { readonly wireId: string; readonly side: WireEndSide };
  },
): number | undefined {
  const requestingWire = project.wires.find((wire) => wire.id === input.except.wireId);
  const requestingEnd = requestingWire?.[input.except.side];
  const requestingTerminal = requestingEnd?.kind === 'free' ? requestingEnd.terminalId : undefined;
  const half = requestingWire === undefined ? 'left' : getWireHalf(project, requestingWire);
  const index = project.wires.findIndex((wire) =>
    SIDES.some((side) => {
      const end = wire[side];
      const isExcepted = wire.id === input.except.wireId && side === input.except.side;
      if (isExcepted || end.kind !== 'free' || getWireHalf(project, wire) !== half) {
        return false;
      }
      if (end.terminalId !== undefined && end.terminalId === requestingTerminal) {
        return false;
      }
      const terminal = project.wiring?.terminals.find((entry) => entry.id === end.terminalId);
      return (terminal?.boardPin ?? end.boardPin) === input.boardPin;
    }),
  );
  return index === -1 ? undefined : index;
}
