import * as z from 'zod';

const oldProjectSchema = z.object({ schemaVersion: z.literal(8) }).loose();
export function migrateV8ToV9(data: unknown): unknown {
  const parsed = oldProjectSchema.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 9, behaviors: [] } : data;
}
