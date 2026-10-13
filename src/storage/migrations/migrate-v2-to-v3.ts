// v3 adds keymap layers (spec 004): one empty Base layer, so every key does nothing.
export function migrateV2ToV3(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return data;
  }
  return { ...data, schemaVersion: 3, layers: [{ id: 'l0', name: 'Base', bindings: {} }] };
}
