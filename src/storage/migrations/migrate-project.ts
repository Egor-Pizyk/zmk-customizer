import { MIGRATIONS } from './migration-steps';

export const CURRENT_SCHEMA_VERSION = 13;

// Index N migrates vN → vN+1. Each schema change adds `migrate-vN-to-vN+1.ts` plus a vN fixture test.

export function migrateProject(
  data: unknown,
  input: { readonly fromVersion: number; readonly toVersion?: number },
): unknown {
  let migrated = data;
  for (
    let version = input.fromVersion;
    version < (input.toVersion ?? CURRENT_SCHEMA_VERSION);
    version += 1
  ) {
    const migration = MIGRATIONS[version];
    if (migration === undefined) {
      throw new Error(`Missing project migration v${version} → v${version + 1}`);
    }
    migrated = migration(migrated);
  }
  return migrated;
}
