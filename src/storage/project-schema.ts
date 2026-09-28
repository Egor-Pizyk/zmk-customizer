import * as z from 'zod';
import { BOARD_PIN_COUNT } from '../domain/board-pin';
import type { Project, Wire, WireEnd, WireEndSide } from '../domain/types';

const pointSchema = z.object({ xU: z.number(), yU: z.number() });

const wireEndSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('key-pin'), keyId: z.string(), pin: z.literal([1, 2]) }),
  z.object({ kind: z.literal('junction'), wireId: z.string(), at: pointSchema }),
  z.object({
    kind: z.literal('free'),
    at: pointSchema,
    boardPin: z
      .int()
      .min(0)
      .max(BOARD_PIN_COUNT - 1)
      .exactOptional(),
  }),
]);

const wireSchema = z.object({
  id: z.string().regex(/^w\d+$/u),
  start: wireEndSchema,
  end: wireEndSchema,
  bends: z.array(pointSchema),
});

type Issue = { readonly message: string; readonly path: readonly (string | number)[] };

function findDuplicateIds(items: readonly { readonly id: string }[], collection: string): Issue[] {
  const seen = new Set<string>();
  const issues: Issue[] = [];
  for (const [index, item] of items.entries()) {
    if (seen.has(item.id)) {
      issues.push({ message: `Duplicate id ${item.id}`, path: [collection, index, 'id'] });
    }
    seen.add(item.id);
  }
  return issues;
}

function findEndIssues(input: {
  readonly end: WireEnd;
  readonly path: readonly (string | number)[];
  readonly wire: Wire;
  readonly keyIds: ReadonlySet<string>;
  readonly wireIds: ReadonlySet<string>;
}): Issue[] {
  const { end, path, wire, keyIds, wireIds } = input;
  if (end.kind === 'key-pin' && !keyIds.has(end.keyId)) {
    return [{ message: `No key with id ${end.keyId}`, path: [...path, 'keyId'] }];
  }
  if (end.kind === 'junction' && (end.wireId === wire.id || !wireIds.has(end.wireId))) {
    return [{ message: `No other wire with id ${end.wireId}`, path: [...path, 'wireId'] }];
  }
  return [];
}

function isSamePin(wire: Wire): boolean {
  const { start, end } = wire;
  return (
    start.kind === 'key-pin' &&
    end.kind === 'key-pin' &&
    start.keyId === end.keyId &&
    start.pin === end.pin
  );
}

function findWireIssues(project: Project): Issue[] {
  const keyIds = new Set(project.keys.map((key) => key.id));
  const wireIds = new Set(project.wires.map((wire) => wire.id));
  const sides: readonly WireEndSide[] = ['start', 'end'];
  const issues: Issue[] = [];
  for (const [index, wire] of project.wires.entries()) {
    for (const side of sides) {
      const path = ['wires', index, side];
      issues.push(...findEndIssues({ end: wire[side], path, wire, keyIds, wireIds }));
    }
    if (wire.start.kind !== 'key-pin' && wire.end.kind !== 'key-pin') {
      issues.push({ message: 'A wire needs a key pin at one end', path: ['wires', index] });
    }
    if (isSamePin(wire)) {
      issues.push({ message: 'Both ends are the same pin', path: ['wires', index, 'end'] });
    }
  }
  return issues;
}

function findCrossingIssues(project: Project): Issue[] {
  const wireIds = new Set(project.wires.map((wire) => wire.id));
  return project.insulatedCrossings.flatMap((crossing, index) => {
    const [first, second] = crossing.wireIds;
    return wireIds.has(first) && wireIds.has(second) && first < second
      ? []
      : [
          {
            message: 'Expected two existing wire ids in ascending order',
            path: ['insulatedCrossings', index, 'wireIds'],
          },
        ];
  });
}

// Describes only the current schemaVersion; older files are migrated before parsing (research R8).
// References must resolve so domain operations never meet a dangling id (003 R15).
export const projectSchema = z
  .object({
    schemaVersion: z.literal(2),
    name: z.string(),
    shieldName: z.string().exactOptional(),
    keys: z.array(z.object({ id: z.string().regex(/^k\d+$/u), xU: z.number(), yU: z.number() })),
    wires: z.array(wireSchema),
    insulatedCrossings: z.array(
      z.object({ wireIds: z.tuple([z.string(), z.string()]), ordinal: z.int().min(0) }),
    ),
  })
  .superRefine((project, context) => {
    const issues = [
      ...findDuplicateIds(project.keys, 'keys'),
      ...findDuplicateIds(project.wires, 'wires'),
      ...findWireIssues(project),
      ...findCrossingIssues(project),
    ];
    for (const issue of issues) {
      context.addIssue({ code: 'custom', message: issue.message, path: [...issue.path] });
    }
  }) satisfies z.ZodType<Project>;
