import * as z from 'zod';

const previous = z.object({ schemaVersion: z.literal(13) }).loose();

/** The frozen v13 checkpoint validates input first; migration never regenerates wiring. */
export function migrateV13ToV14(data: unknown): unknown {
  const parsed = previous.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 14 } : data;
}
