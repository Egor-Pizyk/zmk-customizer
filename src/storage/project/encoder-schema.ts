import * as z from 'zod';
import { PROJECT_BUDGET } from './project-budget';
import { bindingSchema } from './binding-schema';
import type { Encoder } from '@domain';

export const encoderSchema = z.strictObject({
  id: z
    .string()
    .regex(/^e\d+$/u)
    .max(PROJECT_BUDGET.idLength),
  xU: z.number(),
  yU: z.number(),
  half: z.enum(['left', 'right']),
  rotationDeg: z.number().exactOptional(),
  wiringMode: z.literal('schematic').exactOptional(),
  pushKeyId: z
    .string()
    .regex(/^k\d+$/u)
    .max(PROJECT_BUDGET.idLength)
    .exactOptional(),
  aPin: z.int().min(0).max(31).exactOptional(),
  bPin: z.int().min(0).max(31).exactOptional(),
  steps: z.number(),
  triggersPerRotation: z.number(),
}) satisfies z.ZodType<Encoder>;
export const encoderBindingsSchema = z
  .record(
    z
      .string()
      .regex(/^e\d+$/u)
      .max(PROJECT_BUDGET.idLength),
    z.strictObject({ clockwise: bindingSchema, counterclockwise: bindingSchema }),
  )
  .refine((bindings) => Object.keys(bindings).length <= 16, {
    message: 'At most 16 encoder bindings per layer',
  });
