import * as z from 'zod';
import { PROJECT_BUDGET } from './project-budget';
import type { Encoder } from '@domain';

export const legacyEncoderSchema = z.strictObject({
  id: z
    .string()
    .regex(/^e\d+$/u)
    .max(PROJECT_BUDGET.idLength),
  xU: z.number(),
  yU: z.number(),
  half: z.enum(['left', 'right']),
  aPin: z.int().min(0).max(31).exactOptional(),
  bPin: z.int().min(0).max(31).exactOptional(),
  steps: z.number(),
  triggersPerRotation: z.number(),
}) satisfies z.ZodType<Encoder>;
