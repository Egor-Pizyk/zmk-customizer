import { getWirePath } from '@domain/wires/geometry';
import type { Project, WirePoint } from '@domain';

export type BoardPinLabel = {
  readonly id: string;
  readonly at: WirePoint;
  readonly boardPin?: number;
  readonly label?: string;
};

export function getBoardPinLabels(project: Project): readonly BoardPinLabel[] {
  const labels = project.wires.flatMap((wire) => {
    const path = getWirePath(project, wire);
    return (['start', 'end'] as const).flatMap((side): BoardPinLabel[] => {
      const end = wire[side];
      const at = side === 'start' ? path[0] : path.at(-1);
      if (end.kind === 'free' && end.ground === true && at !== undefined) {
        return [{ id: `${wire.id}:${side}`, at, label: 'GND' }];
      }
      if (end.kind === 'free' && end.terminalId !== undefined && at !== undefined) {
        const terminal = project.wiring?.terminals.find((entry) => entry.id === end.terminalId);
        const pinLabel = terminal?.boardPin === undefined ? 'unassigned' : `D${terminal.boardPin}`;
        return [
          {
            id: `${wire.id}:${side}`,
            at,
            label: `${terminal?.half ?? ''} ${terminal?.kind ?? ''} ${terminal?.id ?? ''} ${terminal?.kind === 'ground' ? 'GND' : pinLabel}`,
          },
        ];
      }
      return end.kind === 'free' && end.boardPin !== undefined && at !== undefined
        ? [{ id: `${wire.id}:${side}`, at, boardPin: end.boardPin }]
        : [];
    });
  });
  return labels.filter(
    (label, index) =>
      labels.findIndex(
        (other) =>
          other.label === label.label &&
          other.boardPin === label.boardPin &&
          other.at.xU === label.at.xU &&
          other.at.yU === label.at.yU,
      ) === index,
  );
}
