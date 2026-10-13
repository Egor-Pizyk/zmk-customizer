import * as z from 'zod';
import { PROJECT_BUDGET } from './project-budget';
import { BOARD_PIN_COUNT } from '@domain';
import type { Project, WiringTerminal } from '@domain';

export const wiringSchema = z
  .strictObject({
    kind: z.enum(['matrix', 'direct']),
    topology: z.enum(['unibody', 'split']),
    diodeDirection: z.enum(['row2col', 'col2row']),
    terminals: z
      .array(
        z
          .strictObject({
            id: z
              .string()
              .regex(/^t\d+$/u)
              .max(PROJECT_BUDGET.idLength),
            half: z.enum(['left', 'right']),
            kind: z.enum(['row', 'col', 'input', 'ground']),
            boardPin: z
              .int()
              .min(0)
              .max(BOARD_PIN_COUNT - 1)
              .exactOptional(),
            droppedBoardPin: z.string().min(1).max(160).exactOptional(),
          })
          .refine(
            (terminal) =>
              terminal.kind !== 'ground' ||
              (terminal.boardPin === undefined && terminal.droppedBoardPin === undefined),
            { message: 'Ground is not a GPIO pin' },
          )
          .refine(
            (terminal) => terminal.boardPin === undefined || terminal.droppedBoardPin === undefined,
            { message: 'An assigned terminal cannot also be dropped' },
          ),
      )
      .max(PROJECT_BUDGET.wires),
  })
  .refine(fitsGridBudget, {
    message: `The matrix exceeds the ${PROJECT_BUDGET.crossings}-cell processing budget. Reduce its dimensions.`,
  });
export function findTerminalIssues(project: Project) {
  const issues: { message: string; path: (string | number)[] }[] = [];
  const terminalIds = new Set<string>();
  for (const [index, terminal] of (project.wiring?.terminals ?? []).entries()) {
    if (terminalIds.has(terminal.id)) {
      issues.push({
        message: `Duplicate id ${terminal.id}`,
        path: ['wiring', 'terminals', index, 'id'],
      });
    }
    terminalIds.add(terminal.id);
  }
  for (const [wireIndex, wire] of project.wires.entries()) {
    for (const side of ['start', 'end'] as const) {
      const end = wire[side];
      if (end.kind === 'free' && end.terminalId !== undefined && !terminalIds.has(end.terminalId)) {
        issues.push({
          message: 'No terminal with this id',
          path: ['wires', wireIndex, side, 'terminalId'],
        });
      }
    }
  }
  return issues;
}

function fitsGridBudget(wiring: { readonly terminals: readonly WiringTerminal[] }) {
  return ['left', 'right'].every((half) => {
    const terminals = wiring.terminals.filter((terminal) => terminal.half === half);
    return (
      terminals.filter((terminal) => terminal.kind === 'row').length *
        terminals.filter((terminal) => terminal.kind === 'col').length <=
      PROJECT_BUDGET.crossings
    );
  });
}
