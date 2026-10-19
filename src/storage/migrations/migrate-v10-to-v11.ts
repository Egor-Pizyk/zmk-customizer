import * as z from 'zod';

const previous = z.object({ schemaVersion: z.literal(10) }).loose();
export function migrateV10ToV11(data: unknown): unknown {
  const parsed = previous.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 11, encoders: [] } : data;
}
