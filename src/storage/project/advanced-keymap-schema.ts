import * as z from 'zod';
import type { Combo, Macro, ConditionalLayer } from '@domain';
import { bindingSchema, layerIdSchema } from './binding-schema';
import { PROJECT_BUDGET } from './project-budget';

const id = (prefix: string) =>
  z
    .string()
    .max(PROJECT_BUDGET.idLength)
    .regex(new RegExp(`^${prefix}[0-9]+$`, 'u'));
const name = z.string().max(160);
export const comboSchema = z.strictObject({
  id: id('c'),
  name,
  keyIds: z.array(id('k')).max(20),
  binding: bindingSchema,
  timeoutMs: z.int(),
  layerIds: z.array(layerIdSchema).max(32),
}) satisfies z.ZodType<Combo>;
const stepSchema = z.union([
  z.strictObject({
    id: id('s'),
    kind: z.literal(['tap', 'press', 'release']),
    binding: bindingSchema,
  }),
  z.strictObject({ id: id('s'), kind: z.literal('wait'), durationMs: z.int() }),
]);
export const macroSchema = z.strictObject({
  id: id('m'),
  name,
  waitMs: z.int(),
  tapMs: z.int(),
  steps: z
    .array(stepSchema)
    .max(64)
    .refine(
      (steps) => new Set(steps.map((step) => step.id)).size === steps.length,
      'Duplicate macro step ID',
    ),
}) satisfies z.ZodType<Macro>;
export const conditionalLayerSchema = z.strictObject({
  id: id('q'),
  ifLayerIds: z.array(layerIdSchema).max(32),
  thenLayerId: layerIdSchema,
}) satisfies z.ZodType<ConditionalLayer>;
