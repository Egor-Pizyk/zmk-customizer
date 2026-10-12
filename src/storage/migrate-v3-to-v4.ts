// Diodes are optional; existing circuits gain no components (spec 008 FR-006).
export function migrateV3ToV4(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return data;
  }
  return { ...data, schemaVersion: 4 };
}
