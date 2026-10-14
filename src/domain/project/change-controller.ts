import type { ControllerBoard, Project, WireEnd } from '@domain';

function changeEnd(
  end: WireEnd,
  input: { readonly previous: ControllerBoard; readonly next: ControllerBoard },
): WireEnd {
  if (end.kind !== 'free' || end.boardPin === undefined) {
    return end;
  }
  const { previous, next } = input;
  if (previous.family === next.family && next.gpioPins.includes(end.boardPin)) {
    return end;
  }
  const label =
    previous.pins.find((pin) => pin.index === end.boardPin)?.label ?? `D${end.boardPin}`;
  return { kind: 'free', at: end.at, droppedBoardPin: `${previous.name} ${label}` };
}

export function changeController(
  project: Project,
  input: { readonly boardId: string; readonly boards: readonly ControllerBoard[] },
): Project {
  const previous = input.boards.find((board) => board.id === project.controllerId);
  const next = input.boards.find((board) => board.id === input.boardId);
  if (previous === undefined || next === undefined || previous.id === next.id) {
    return project;
  }
  return {
    ...project,
    controllerId: next.id,
    ...(project.wiring === undefined
      ? {}
      : {
          wiring: {
            ...project.wiring,
            terminals: project.wiring.terminals.map((terminal) => {
              if (
                terminal.boardPin === undefined ||
                (previous.family === next.family && next.gpioPins.includes(terminal.boardPin))
              ) {
                return terminal;
              }
              const { boardPin, ...rest } = terminal;
              const label =
                previous.pins.find((pin) => pin.index === boardPin)?.label ?? `D${boardPin}`;
              return { ...rest, droppedBoardPin: `${previous.name} ${label}` };
            }),
          },
        }),
    wires: project.wires.map((wire) => ({
      ...wire,
      start: changeEnd(wire.start, { previous, next }),
      end: changeEnd(wire.end, { previous, next }),
    })),
  };
}
