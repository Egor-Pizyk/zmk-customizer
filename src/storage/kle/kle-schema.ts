import { z } from 'zod';

export const klePropertiesSchema = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    w: z.number().positive().optional(),
    h: z.number().positive().optional(),
    r: z.number().optional(),
    rx: z.number().optional(),
    ry: z.number().optional(),
    d: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const kleLayoutSchema = z.array(
  z.union([z.array(z.union([z.string(), klePropertiesSchema])), z.record(z.string(), z.unknown())]),
);

export type KleProperties = z.infer<typeof klePropertiesSchema>;
export type KleRows = z.infer<typeof kleLayoutSchema>;
