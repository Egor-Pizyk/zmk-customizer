import type { ControllerBoard, Project, ValidationIssue, WireEnd, WireEndSide } from '../types';

function validateEnd(
  end: WireEnd,
  input: {
    readonly board: ControllerBoard;
    readonly wireIndex: number;
    readonly side: WireEndSide;
  },
): ValidationIssue[] {
  if (end.kind !== 'free') {
    return [];
  }
  const { board, wireIndex, side } = input;
  const path = ['wires', wireIndex, side, 'boardPin'];
  if (end.droppedBoardPin !== undefined) {
    return [
      {
        code: 'board-pin-dropped',
        path,
        message: `Wire ${wireIndex} ${side} was assigned to ${end.droppedBoardPin}. Choose a pin on ${board.name} or explicitly clear the assignment in Schematic.`,
      },
    ];
  }
  return end.boardPin !== undefined && !board.gpioPins.includes(end.boardPin)
    ? [
        {
          code: 'shield-pin-unsupported',
          path,
          message: `Wire ${wireIndex} ${side} uses D${end.boardPin}, unavailable on ${board.name}. Choose an exposed controller pin in Schematic.`,
        },
      ]
    : [];
}

export function validateControllerPins(
  project: Project,
  board: ControllerBoard,
): readonly ValidationIssue[] {
  return project.wires.flatMap((wire, wireIndex) => [
    ...validateEnd(wire.start, { board, wireIndex, side: 'start' }),
    ...validateEnd(wire.end, { board, wireIndex, side: 'end' }),
  ]);
}
