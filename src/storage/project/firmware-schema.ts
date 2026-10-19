import { PROJECT_BUDGET } from './project-budget';
import * as z from 'zod';

export const firmwareSchema = z
  .record(
    z
      .string()
      .regex(/^CONFIG_[A-Z0-9_]+$/u)
      .max(96),
    z.union([z.boolean(), z.number(), z.string().max(PROJECT_BUDGET.firmwareStringLength)]),
  )
  .refine((values) => Object.keys(values).length <= PROJECT_BUDGET.firmwareOptions, {
    message: 'At most 128 firmware overrides are supported',
  });
