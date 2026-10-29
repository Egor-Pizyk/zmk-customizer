import { getWirePath } from '@domain/wires/geometry';
import type { Project, WirePoint, WiringTerminal } from '@domain';

export type BoardPinLabel = {
  readonly id: string;
  readonly at: WirePoint;
  readonly boardPin?: number;
  readonly label?: string;
  readonly aboveWire?: true;
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
            label: terminalLabel(project, terminal, pinLabel),
            ...(project.routing?.matrixStyle === 'symmetric-bus' && terminal?.kind === 'row'
              ? { aboveWire: true as const }
              : {}),
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

function terminalLabel(
  project: Project,
  terminal: WiringTerminal | undefined,
  pinLabel: string,
): string {
  if (
    project.routing?.matrixStyle === 'symmetric-bus' &&
    terminal !== undefined &&
    (terminal.kind === 'row' || terminal.kind === 'col')
  ) {
    const index =
      project.wiring?.terminals
        .filter((entry) => entry.half === terminal.half && entry.kind === terminal.kind)
        .findIndex((entry) => entry.id === terminal.id) ?? 0;
    const half =
      project.wiring?.topology === 'split' ? `${terminal.half === 'left' ? 'L' : 'R'} ` : '';
    return `${half}${terminal.kind === 'row' ? 'R' : 'C'}${index} ${pinLabel}`;
  }
  return `${terminal?.half ?? ''} ${terminal?.kind ?? ''} ${terminal?.id ?? ''} ${terminal?.kind === 'ground' ? 'GND' : pinLabel}`;
}
