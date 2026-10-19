import * as z from 'zod';

const previous = z.object({ schemaVersion: z.literal(9) }).loose();
export function migrateV9ToV10(data: unknown): unknown {
  const parsed = previous.safeParse(data);
  return parsed.success
    ? { ...parsed.data, schemaVersion: 10, combos: [], macros: [], conditionalLayers: [] }
    : data;
}
