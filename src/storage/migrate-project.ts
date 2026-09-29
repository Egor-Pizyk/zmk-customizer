import { migrateV1ToV2 } from './migrate-v1-to-v2';
import { migrateV2ToV3 } from './migrate-v2-to-v3';

export const CURRENT_SCHEMA_VERSION = 3;

type Migration = (data: unknown) => unknown;

// Index N migrates vN → vN+1. Each schema change adds `migrate-vN-to-vN+1.ts` plus a vN fixture test.
const MIGRATIONS: readonly (Migration | undefined)[] = [undefined, migrateV1ToV2, migrateV2ToV3];

export function migrateProject(data: unknown, input: { readonly fromVersion: number }): unknown {
  let migrated = data;
  for (let version = input.fromVersion; version < CURRENT_SCHEMA_VERSION; version += 1) {
    const migration = MIGRATIONS[version];
    if (migration === undefined) {
      throw new Error(`Missing project migration v${version} → v${version + 1}`);
    }
    migrated = migration(migrated);
  }
  return migrated;
}
