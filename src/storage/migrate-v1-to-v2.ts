// v2 adds the schematic (spec 003): keys, wires and insulated crossings, all empty for old files.
export function migrateV1ToV2(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return data;
  }
  return { ...data, schemaVersion: 2, keys: [], wires: [], insulatedCrossings: [] };
}
