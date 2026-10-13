import { migrateV6ToV7 } from './migrate-v6-to-v7';
import { migrateV5ToV6 } from './migrate-v5-to-v6';
import { migrateV4ToV5 } from './migrate-v4-to-v5';
import { migrateV3ToV4 } from './migrate-v3-to-v4';
import { migrateV1ToV2 } from './migrate-v1-to-v2';
import { migrateV2ToV3 } from './migrate-v2-to-v3';

export const CURRENT_SCHEMA_VERSION = 7;

type Migration = (data: unknown) => unknown;

// Index N migrates vN → vN+1. Each schema change adds `migrate-vN-to-vN+1.ts` plus a vN fixture test.
const MIGRATIONS: readonly (Migration | undefined)[] = [
  undefined,
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV4ToV5,
  migrateV5ToV6,
  migrateV6ToV7,
];

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
