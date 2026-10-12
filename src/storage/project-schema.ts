import * as z from 'zod';
import { PROJECT_BUDGET } from './project-budget';
import { CONTROLLER_BOARDS } from '../catalog/controller-boards';
import { BOARD_PIN_COUNT } from '../domain/board-pin';
import { MODIFIERS } from '../domain/types';
import type { Project, Wire, WireEnd, WireEndSide } from '../domain/types';

const pointSchema = z.strictObject({ xU: z.number(), yU: z.number() });

const wireEndSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('key-pin'), keyId: z.string(), pin: z.literal([1, 2]) }),
  z.strictObject({ kind: z.literal('junction'), wireId: z.string(), at: pointSchema }),
  z.strictObject({
    kind: z.literal('free'),
    at: pointSchema,
    boardPin: z
      .int()
      .min(0)
      .max(BOARD_PIN_COUNT - 1)
      .exactOptional(),
    droppedBoardPin: z.string().min(1).max(160).exactOptional(),
  }),
]);

const checkedWireEndSchema = wireEndSchema.refine(
  (end) => end.kind !== 'free' || end.boardPin === undefined || end.droppedBoardPin === undefined,
  { message: 'An assigned pin cannot also be a dropped assignment' },
);

const wireSchema = z.strictObject({
  id: z
    .string()
    .max(PROJECT_BUDGET.idLength)
    .regex(/^w\d+$/u),
  start: checkedWireEndSchema,
  end: checkedWireEndSchema,
  bends: z.array(pointSchema).max(PROJECT_BUDGET.bendsPerWire),
});

const modifierSchema = z.enum(MODIFIERS);

// Unique and in MODIFIERS order, so equal bindings are deep-equal (spec 004 contracts/project-schema.md).
const keyStrokeSchema = z.strictObject({
  keycode: z.string().min(1).max(PROJECT_BUDGET.stringLength),
  modifiers: z
    .array(modifierSchema)
    .refine(
      (modifiers) =>
        modifiers.every(
          (modifier, index) =>
            index === 0 ||
            MODIFIERS.indexOf(modifier) > MODIFIERS.indexOf(modifiers[index - 1] ?? modifier),
        ),
      { message: 'Expected unique modifiers in the order LC LS LA LG RC RS RA RG' },
    ),
});

const layerIdSchema = z
  .string()
  .max(PROJECT_BUDGET.idLength)
  .regex(/^l\d+$/u);

// Unknown keycodes and profiles beyond the profile count are validation issues, not schema
// errors, so such a file still opens (spec 004 research R7).
// z.union, not discriminatedUnion: `bt` has two shapes under one kind. A failing binding is
// reported at its own path (layers.L.bindings.keyId).
const bindingSchema = z.union([
  z.strictObject({ kind: z.literal(['kp', 'sk', 'kt']), key: keyStrokeSchema }),
  z.strictObject({ kind: z.literal('mt'), hold: keyStrokeSchema, tap: keyStrokeSchema }),
  z.strictObject({
    kind: z.literal([
      'trans',
      'none',
      'caps_word',
      'key_repeat',
      'gresc',
      'sys_reset',
      'bootloader',
    ]),
  }),
  z.strictObject({
    kind: z.literal('bt'),
    command: z.enum(['BT_CLR', 'BT_CLR_ALL', 'BT_NXT', 'BT_PRV']),
  }),
  z.strictObject({
    kind: z.literal('bt'),
    command: z.enum(['BT_SEL', 'BT_DISC']),
    profile: z.int().min(0),
  }),
  z.strictObject({ kind: z.literal('out'), command: z.enum(['OUT_TOG', 'OUT_USB', 'OUT_BLE']) }),
  z.strictObject({
    kind: z.literal('tap_dance'),
    taps: z.array(keyStrokeSchema).min(1).max(PROJECT_BUDGET.taps),
    tappingTermMs: z.int(),
  }),
  z.strictObject({
    kind: z.literal('mod_morph'),
    normal: keyStrokeSchema,
    morphed: keyStrokeSchema,
    mods: z
      .array(modifierSchema)
      .min(1)
      .refine(
        (mods) =>
          mods.every(
            (modifier, index) =>
              index === 0 ||
              MODIFIERS.indexOf(modifier) > MODIFIERS.indexOf(mods[index - 1] ?? modifier),
          ),
        { message: 'Expected unique modifiers in the order LC LS LA LG RC RS RA RG' },
      ),
  }),
  z.strictObject({ kind: z.literal(['mo', 'tog', 'to', 'sl']), layerId: layerIdSchema }),
  z.strictObject({ kind: z.literal('lt'), layerId: layerIdSchema, tap: keyStrokeSchema }),
]);

const layerSchema = z.strictObject({
  id: layerIdSchema,
  name: z.string().max(PROJECT_BUDGET.stringLength),
  bindings: z.record(z.string(), bindingSchema),
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

function findLayerIssues(project: Project): Issue[] {
  const keyIds = new Set(project.keys.map((key) => key.id));
  return project.layers.flatMap((layer, index) =>
    Object.keys(layer.bindings)
      .filter((keyId) => !keyIds.has(keyId))
      .map((keyId) => ({
        message: `No key with id ${keyId}`,
        path: ['layers', index, 'bindings', keyId],
      })),
  );
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
// References must resolve so domain operations never meet a dangling id (003 R15). Exception:
// a layer behavior's layerId may name a deleted layer; no operation dereferences it and
// validation reports it (spec 007 R2).
// The top level strips unknown keys (forward compat, tested in parse-project-file.test.ts);
// every nested node is strict so a malformed binding, wire or key is rejected at its own path.
export const projectSchema = z
  .object({
    schemaVersion: z.literal(5),
    controllerId: z.enum(CONTROLLER_BOARDS.map((board) => board.id)),
    name: z.string().max(PROJECT_BUDGET.stringLength),
    shieldName: z.string().max(PROJECT_BUDGET.stringLength).exactOptional(),
    keys: z
      .array(
        z.strictObject({
          id: z
            .string()
            .max(PROJECT_BUDGET.idLength)
            .regex(/^k\d+$/u),
          xU: z.number(),
          yU: z.number(),
          diode: z
            .strictObject({
              pin: z.literal([1, 2]),
              cathode: z.enum(['toward-switch', 'away-switch']),
            })
            .exactOptional(),
        }),
      )
      .max(PROJECT_BUDGET.keys),
    wires: z.array(wireSchema).max(PROJECT_BUDGET.wires),
    insulatedCrossings: z
      .array(
        z.strictObject({ wireIds: z.tuple([z.string(), z.string()]), ordinal: z.int().min(0) }),
      )
      .max(PROJECT_BUDGET.crossings),
    layers: z.array(layerSchema).min(1).max(PROJECT_BUDGET.layers),
  })
  .superRefine((project, context) => {
    const segmentCount = project.wires.reduce(
      (count, wire) => count + 2 * (wire.bends.length + 1),
      0,
    );
    if (segmentCount > PROJECT_BUDGET.segments) {
      context.addIssue({
        code: 'custom',
        message: `The wiring exceeds the ${PROJECT_BUDGET.segments}-segment processing budget. Simplify the wire bends.`,
        path: ['wires'],
      });
    }
    for (const [index, layer] of project.layers.entries()) {
      if (Object.keys(layer.bindings).length > PROJECT_BUDGET.keys) {
        context.addIssue({
          code: 'custom',
          message: 'Too many binding entries',
          path: ['layers', index, 'bindings'],
        });
      }
    }
    const issues = [
      ...findDuplicateIds(project.keys, 'keys'),
      ...findDuplicateIds(project.wires, 'wires'),
      ...findWireIssues(project),
      ...findCrossingIssues(project),
      ...findDuplicateIds(project.layers, 'layers'),
      ...findLayerIssues(project),
    ];
    for (const issue of issues) {
      context.addIssue({ code: 'custom', message: issue.message, path: [...issue.path] });
    }
  }) satisfies z.ZodType<Project>;
