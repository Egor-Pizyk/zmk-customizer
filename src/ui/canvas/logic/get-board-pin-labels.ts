import { getKeyCorners } from '@domain/geometry';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, Wire, WirePoint, WiringTerminal } from '@domain';

export type BoardPinLabel = {
  readonly id: string;
  readonly at: WirePoint;
  readonly boardPin?: number;
  readonly label?: string;
  readonly aboveWire?: true;
  readonly placement?: 'direct-input' | 'direct-ground';
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
        return [boundLabel(project, { wire, side, at, terminalId: end.terminalId })];
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
  if (project.wiring?.kind === 'direct' && terminal !== undefined) {
    const half =
      project.wiring.topology === 'split' ? `${terminal.half === 'left' ? 'L' : 'R'} ` : '';
    return `${half}${directCaption(terminal, pinLabel)}`;
  }
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

function boundLabel(
  project: Project,
  input: {
    readonly wire: Wire;
    readonly side: 'start' | 'end';
    readonly at: WirePoint;
    readonly terminalId: string;
  },
): BoardPinLabel {
  const terminal = project.wiring?.terminals.find((entry) => entry.id === input.terminalId);
  const pinLabel = terminal?.boardPin === undefined ? 'unassigned' : `D${terminal.boardPin}`;
  const direct = directPlacement(project, input.wire, terminal);
  return {
    id: `${input.wire.id}:${input.side}`,
    at: direct?.at ?? input.at,
    label:
      direct === undefined
        ? terminalLabel(project, terminal, pinLabel)
        : directCaption(terminal, pinLabel),
    ...(direct === undefined ? {} : { placement: direct.placement }),
    ...(project.wiring?.kind === 'direct' ||
    (project.routing?.matrixStyle === 'symmetric-bus' && terminal?.kind === 'row')
      ? { aboveWire: true as const }
      : {}),
  };
}
function directPlacement(
  project: Project,
  wire: Wire,
  terminal: WiringTerminal | undefined,
): { readonly at: WirePoint; readonly placement: 'direct-input' | 'direct-ground' } | undefined {
  const pin = wire.start.kind === 'key-pin' ? wire.start : wire.end;
  if (project.wiring?.kind !== 'direct' || pin.kind !== 'key-pin') {
    return undefined;
  }
  const key = project.keys.find((entry) => entry.id === pin.keyId);
  if (key === undefined) {
    return undefined;
  }
  const [origin, topRight, , bottomLeft] = getKeyCorners(key);
  if (origin === undefined || topRight === undefined || bottomLeft === undefined) {
    return undefined;
  }
  const ground = terminal?.kind === 'ground';
  const horizontal = ground ? 0.55 : 0.08;
  const vertical = ground ? 0.85 : 0.18;
  return {
    at: {
      xU:
        origin.xU + horizontal * (topRight.xU - origin.xU) + vertical * (bottomLeft.xU - origin.xU),
      yU:
        origin.yU + horizontal * (topRight.yU - origin.yU) + vertical * (bottomLeft.yU - origin.yU),
    },
    placement: ground ? ('direct-ground' as const) : ('direct-input' as const),
  };
}

function directCaption(terminal: WiringTerminal | undefined, pinLabel: string): string {
  if (terminal?.kind === 'ground') {
    return 'GND';
  }
  return terminal?.boardPin === undefined ? 'D?' : pinLabel;
}
