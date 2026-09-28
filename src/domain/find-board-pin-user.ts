import type { Project, WireEndSide } from './types';

const SIDES: readonly WireEndSide[] = ['start', 'end'];

/** Index of the first wire whose free end uses `boardPin`, other than `except` (FR-020). */
export function findBoardPinUser(
  project: Project,
  input: {
    readonly boardPin: number;
    readonly except: { readonly wireId: string; readonly side: WireEndSide };
  },
): number | undefined {
  const index = project.wires.findIndex((wire) =>
    SIDES.some((side) => {
      const end = wire[side];
      const isExcepted = wire.id === input.except.wireId && side === input.except.side;
      return !isExcepted && end.kind === 'free' && end.boardPin === input.boardPin;
    }),
  );
  return index === -1 ? undefined : index;
}
