import {
  contactSchema,
  findContactPoolIssues,
  findWireContactReferenceIssues,
} from './wire-contact-schema';
import { getWireSegmentCount } from '@domain/wires/geometry';
import { layerSchema } from './project-layer-schema';
import { legacyProjectContentSchema as projectContentSchema } from './project-content-schema';
import { wiringSchema, findTerminalIssues } from './wiring-schema';
import { PROJECT_BUDGET } from './project-budget';
import { CONTROLLER_BOARDS } from '@catalog/controllers';
import { BOARD_PIN_COUNT, findWireContactError } from '@domain/wires';
import type { Project as CurrentProject, Wire, WireEnd, WireEndSide } from '@domain';

import * as z from 'zod';

type Project = Omit<CurrentProject, 'schemaVersion'> & { readonly schemaVersion: 12 };

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
    terminalId: z
      .string()
      .regex(/^t\d+$/u)
      .max(PROJECT_BUDGET.idLength)
      .exactOptional(),
    droppedBoardPin: z.string().min(1).max(160).exactOptional(),
  }),
]);

const checkedWireEndSchema = wireEndSchema.refine(
  (end) =>
    end.kind !== 'free' ||
    [end.boardPin, end.droppedBoardPin, end.terminalId].filter((value) => value !== undefined)
      .length <= 1,
  { message: 'An assigned pin cannot also be a dropped assignment' },
);

const wireSchema = z.strictObject({
  contactIds: z.array(z.int().min(0).max(1023)).max(1024).exactOptional(),
  half: z.enum(['left', 'right']).exactOptional(),
  id: z
    .string()
    .max(PROJECT_BUDGET.idLength)
    .regex(/^w\d+$/u),
  start: checkedWireEndSchema,
  end: checkedWireEndSchema,
  bends: z.array(pointSchema).max(PROJECT_BUDGET.bendsPerWire),
  anchors: z.strictObject({ start: pointSchema, end: pointSchema }).exactOptional(),
  contacts: z
    .array(contactSchema)
    .max(2 * PROJECT_BUDGET.keys)
    .exactOptional(),
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
    issues.push(...findWireContactReferenceIssues({ ...project, schemaVersion: 13 }, wire, index));
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

// a layer behavior's layerId may name a deleted layer; no operation dereferences it and
// validation reports it (spec 007 R2).
// The top level strips unknown keys (forward compat, tested in parse-project-file.test.ts);
// every nested node is strict so a malformed binding, wire or key is rejected at its own path.
export const legacyV12ProjectSchema = z
  .object({
    schemaVersion: z.literal(12),
    wireContacts: z
      .array(z.union([contactSchema, z.literal(false)]))
      .max(1024)
      .exactOptional(),
    ...projectContentSchema.shape,
    wiring: wiringSchema.exactOptional(),
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
          half: z.enum(['left', 'right']).exactOptional(),
          xU: z.number(),
          yU: z.number(),
          widthU: z.number().exactOptional(),
          heightU: z.number().exactOptional(),
          rotationDeg: z.number().exactOptional(),
          rotationOriginXU: z.number().exactOptional(),
          rotationOriginYU: z.number().exactOptional(),
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
      ...findTerminalIssues({ ...project, schemaVersion: 13 }),
      ...findDuplicateIds(project.keys, 'keys'),
      ...findDuplicateIds(project.encoders, 'encoders'),
      ...findEncoderBindingIssues(project),
      ...findDuplicateIds(project.wires, 'wires'),
      ...findWireIssues(project),
      ...findContactPoolIssues({ ...project, schemaVersion: 13 }),
      ...findCrossingIssues(project),
      ...findDuplicateIds(project.layers, 'layers'),
      ...findDuplicateIds(project.behaviors, 'behaviors'),
      ...findDuplicateIds(project.combos, 'combos'),
      ...findDuplicateIds(project.macros, 'macros'),
      ...findDuplicateIds(project.conditionalLayers, 'conditionalLayers'),
      ...findLayerIssues(project),
    ];
    if (issues.length === 0) {
      issues.push(...findContactIssues(project));
    }
    for (const issue of issues) {
      context.addIssue({ code: 'custom', message: issue.message, path: [...issue.path] });
    }
  }) satisfies z.ZodType<Project>;

function findEncoderBindingIssues(project: Project): Issue[] {
  const ids = new Set(project.encoders.map((encoder) => encoder.id));
  return project.layers.flatMap((layer, index) =>
    Object.keys(layer.encoderBindings ?? {})
      .filter((id) => !ids.has(id))
      .map((id) => ({
        message: `No encoder with id ${id}`,
        path: ['layers', index, 'encoderBindings', id],
      })),
  );
}

function findContactIssues(project: Project): Issue[] {
  const issues: Issue[] = [];

  for (const [index, wire] of project.wires.entries()) {
    const message = findWireContactError({ ...project, schemaVersion: 13 }, wire);
    if (message !== undefined) {
      issues.push({ message, path: ['wires', index, 'contacts'] });
    }
  }
  if (getWireSegmentCount(project) > PROJECT_BUDGET.segments) {
    issues.push({
      message: 'The wiring exceeds the segment processing budget. Simplify bends or pin leads.',
      path: ['wires'],
    });
  }

  return issues;
}
