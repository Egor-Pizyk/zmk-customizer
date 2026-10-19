import * as z from 'zod';

const oldProjectSchema = z.object({ schemaVersion: z.literal(7) }).loose();

export function migrateV7ToV8(data: unknown): unknown {
  const parsed = oldProjectSchema.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 8, firmware: {} } : data;
}
