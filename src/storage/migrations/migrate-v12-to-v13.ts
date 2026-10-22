import * as z from 'zod';

const previous = z.object({ schemaVersion: z.literal(12) }).loose();

/** parseProjectFile validates the frozen v12 schema before entering this identity migration. */
export function migrateV12ToV13(data: unknown): unknown {
  const parsed = previous.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 13 } : data;
}
