import { getWirePath } from '../../domain/get-wire-path';
import type { Project, WirePoint } from '../../domain/types';

export type BoardPinLabel = {
  readonly id: string;
  readonly at: WirePoint;
  readonly boardPin: number;
};

export function getBoardPinLabels(project: Project): readonly BoardPinLabel[] {
  return project.wires.flatMap((wire) => {
    const path = getWirePath(project, wire);
    return (['start', 'end'] as const).flatMap((side) => {
      const end = wire[side];
      const at = side === 'start' ? path[0] : path.at(-1);
      return end.kind === 'free' && end.boardPin !== undefined && at !== undefined
        ? [{ id: `${wire.id}:${side}`, at, boardPin: end.boardPin }]
        : [];
    });
  });
}
