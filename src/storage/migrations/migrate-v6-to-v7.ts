import * as z from 'zod';

const oldProjectSchema = z.object({ schemaVersion: z.literal(6) }).loose();

// Bus identities are initialized on the first wiring edit; loading never reroutes user wires.
export function migrateV6ToV7(data: unknown): unknown {
  const parsed = oldProjectSchema.safeParse(data);
  return parsed.success ? { ...parsed.data, schemaVersion: 7 } : data;
}
