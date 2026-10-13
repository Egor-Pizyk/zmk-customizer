import * as z from 'zod';

const oldProjectSchema = z
  .object({
    schemaVersion: z.literal(5),
    keys: z.array(
      z.strictObject({
        id: z.string(),
        xU: z.number(),
        yU: z.number(),
        diode: z
          .strictObject({
            pin: z.literal([1, 2]),
            cathode: z.enum(['toward-switch', 'away-switch']),
          })
          .exactOptional(),
      }),
    ),
  })
  .loose();

export function migrateV5ToV6(data: unknown): unknown {
  const parsed = oldProjectSchema.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 6 } : data;
}
