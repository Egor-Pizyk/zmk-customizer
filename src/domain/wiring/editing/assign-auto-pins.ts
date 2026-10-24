import { getNets } from '@domain/wires/nets';
import { getWireHalf } from '@domain/wiring';
import { getRetainedWires } from './get-retained-wires';
import type { ControllerBoard, Half, Project, Result, WiringTerminal } from '@domain';

export function assignAutoPins(
  project: Project,
  input: {
    readonly board: ControllerBoard;
    readonly retainAllWires?: boolean;
    readonly terminals: readonly WiringTerminal[];
  },
): Result<readonly WiringTerminal[], string> {
  const terminals: WiringTerminal[] = [];
  for (const half of ['left', 'right'] as const) {
    const occupied = getOccupiedPins(project, half, input.retainAllWires === true);
    const halfTerminals = input.terminals.filter((terminal) => terminal.half === half);
    const error =
      findPreviousError(project, { half, occupied, board: input.board }) ??
      findAssignmentError(halfTerminals, { occupied, board: input.board });
    if (error !== undefined) {
      return assignmentFailure(`${half}: ${error} Repair the pin assignments before Auto assign.`);
    }
    const used = new Set([
      ...occupied,
      ...halfTerminals.flatMap((terminal) =>
        terminal.boardPin === undefined ? [] : [terminal.boardPin],
      ),
    ]);
    const available = input.board.gpioPins.filter((pin) => !used.has(pin));
    const missing = halfTerminals.filter(
      (terminal) => terminal.kind !== 'ground' && terminal.boardPin === undefined,
    ).length;
    if (missing > available.length) {
      return {
        ok: false,
        error: `${half} needs ${missing} more GPIOs, but only ${available.length} are free on ${input.board.name}. Adjust the grid or group rows manually; reduce dimensions or free occupied pins.`,
      };
    }
    terminals.push(...fillMissingPins(halfTerminals, available));
  }
  return { ok: true, value: terminals };
}

function getOccupiedPins(project: Project, half: Half, retainAllWires: boolean): readonly number[] {
  const encoderPins = project.encoders
    .filter((encoder) => encoder.half === half && encoder.wiringMode !== 'schematic')
    .flatMap((encoder) => [encoder.aPin, encoder.bPin].filter((pin) => pin !== undefined));
  const retained = new Set(
    (retainAllWires ? project.wires : getRetainedWires(project)).map((wire) => wire.id),
  );
  const manualPins: number[] = [];
  for (const net of getNets(project)) {
    if (retainAllWires && net.terminalIds.length > 0) {
      continue;
    }
    const pins = new Set(
      net.boardPins
        .filter((contact) => retained.has(contact.wireId))
        .filter((contact) =>
          project.wires.some(
            (wire) => wire.id === contact.wireId && getWireHalf(project, wire) === half,
          ),
        )
        .map((contact) => contact.boardPin),
    );
    manualPins.push(...pins);
  }
  return [...encoderPins, ...manualPins];
}

function findAssignmentError(
  terminals: readonly WiringTerminal[],
  input: { readonly occupied: readonly number[]; readonly board: ControllerBoard },
): string | undefined {
  const used = new Set(input.occupied);
  if (input.occupied.some((pin) => !input.board.gpioPins.includes(pin))) {
    return 'An occupied GPIO is unavailable on this controller.';
  }
  if (used.size !== input.occupied.length) {
    return 'Existing encoder or manual GPIO assignments conflict.';
  }
  for (const terminal of terminals) {
    if (terminal.kind === 'ground') {
      continue;
    }
    if (terminal.droppedBoardPin !== undefined) {
      return `Terminal ${terminal.id} has an unavailable pin.`;
    }
    if (terminal.boardPin === undefined) {
      continue;
    }
    if (!input.board.gpioPins.includes(terminal.boardPin)) {
      return `GPIO ${terminal.boardPin} is unavailable.`;
    }
    if (used.has(terminal.boardPin)) {
      return `GPIO ${terminal.boardPin} is already occupied.`;
    }
    used.add(terminal.boardPin);
  }
  return undefined;
}

function fillMissingPins(
  halfTerminals: readonly WiringTerminal[],
  available: readonly number[],
): readonly WiringTerminal[] {
  const terminals: WiringTerminal[] = [];
  let next = 0;
  for (const terminal of halfTerminals) {
    const boardPin = available[next];
    if (terminal.kind === 'ground' || terminal.boardPin !== undefined || boardPin === undefined) {
      terminals.push(terminal);
      continue;
    }
    terminals.push({ ...terminal, boardPin });
    next += 1;
  }
  return terminals;
}

function findPreviousError(
  project: Project,
  input: {
    readonly half: Half;
    readonly occupied: readonly number[];
    readonly board: ControllerBoard;
  },
) {
  const previous =
    project.wiring?.terminals.filter((terminal) => terminal.half === input.half) ?? [];
  return findAssignmentError(previous, input) ?? findLegacyPinError(project, input);
}

function findLegacyPinError(
  project: Project,
  input: {
    readonly half: Half;
    readonly occupied: readonly number[];
    readonly board: ControllerBoard;
  },
): string | undefined {
  const used = new Set([...input.occupied, ...getTerminalPins(project, input.half)]);
  for (const net of getNets(project)) {
    if (net.pins.length === 0) {
      continue;
    }
    const pins = new Set(
      net.boardPins
        .filter((contact) =>
          project.wires.some(
            (wire) => wire.id === contact.wireId && getWireHalf(project, wire) === input.half,
          ),
        )
        .map((contact) => contact.boardPin),
    );
    if (pins.size > 1) {
      return 'A manual circuit joins different GPIOs. Repair its connections.';
    }
    for (const pin of pins) {
      if (!input.board.gpioPins.includes(pin)) {
        return `GPIO ${pin} is unavailable.`;
      }
      const sameTerminal = project.wiring?.terminals.some(
        (terminal) => net.terminalIds.includes(terminal.id) && terminal.boardPin === pin,
      );
      if (used.has(pin) && sameTerminal !== true) {
        return `GPIO ${pin} is already occupied.`;
      }
      used.add(pin);
    }
  }
  return undefined;
}

function getTerminalPins(project: Project, half: Half): readonly number[] {
  return (
    project.wiring?.terminals
      .filter((terminal) => terminal.half === half)
      .flatMap((terminal) => (terminal.boardPin === undefined ? [] : [terminal.boardPin])) ?? []
  );
}

function assignmentFailure(error: string): Result<readonly WiringTerminal[], string> {
  return { ok: false, error };
}
