import { PROJECT_BUDGET } from './project-budget';
import { BOARD_PIN_COUNT } from '@domain/wires';
import type { Project, WiringTerminal, RoutingSettings } from '@domain';
import * as z from 'zod';
import { ZMK_LIMITS } from '@catalog/firmware';
import { roundU } from '@domain/geometry';

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

const maxDistanceU = (ZMK_LIMITS.maxLayoutCell - ZMK_LIMITS.minLayoutCell) / 100;
const distance = z
  .number()
  .positive()
  .max(maxDistanceU)
  .refine((value) => roundU(value) > 0, {
    message: 'Use a distance of at least 0.0001u after rounding.',
  });

export const routingSchema = z.strictObject({
  matrixStyle: z.enum(['existing', 'symmetric-bus']),
  offsetU: distance,
  clearanceU: distance,
  fallbackRowIntervalU: distance,
  mirrorAxisXU: z
    .number()
    .min(ZMK_LIMITS.minLayoutCell / 100)
    .max(ZMK_LIMITS.maxLayoutCell / 100)
    .exactOptional(),
  preferredScope: z.enum(['all', 'half', 'selection']),
  preferredHalf: z.enum(['left', 'right']).exactOptional(),
  rowPin: z.literal([1, 2]).exactOptional(),
  diodeSide: z.enum(['row', 'col']).exactOptional(),
  targetCells: z
    .array(
      z.strictObject({
        keyId: z
          .string()
          .regex(/^k\d+$/u)
          .max(PROJECT_BUDGET.idLength),
        half: z.enum(['left', 'right']),
        row: z.int().min(0).max(254),
        col: z.int().min(0).max(254),
      }),
    )
    .max(PROJECT_BUDGET.keys)
    .exactOptional(),
}) satisfies z.ZodType<RoutingSettings>;

export function findRoutingReferenceIssues(project: Pick<Project, 'routing' | 'keys'>) {
  const seen = new Set<string>();
  const issues: { message: string; path: (string | number)[] }[] = [];
  for (const [index, cell] of (project.routing?.targetCells ?? []).entries()) {
    const key = project.keys.find((entry) => entry.id === cell.keyId);
    if (key === undefined || seen.has(cell.keyId)) {
      issues.push({
        message: 'Choose an existing key once per desired assignment.',
        path: ['routing', 'targetCells', index, 'keyId'],
      });
    } else if ((key.half ?? 'left') !== cell.half) {
      issues.push({
        message: 'The desired assignment must use the key’s half.',
        path: ['routing', 'targetCells', index, 'half'],
      });
    }
    seen.add(cell.keyId);
  }
  return issues;
}
