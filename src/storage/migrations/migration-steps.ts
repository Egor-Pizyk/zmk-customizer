import { migrateV12ToV13 } from './migrate-v12-to-v13';
import { migrateV11ToV12 } from './migrate-v11-to-v12';
import { migrateV10ToV11 } from './migrate-v10-to-v11';
import { migrateV9ToV10 } from './migrate-v9-to-v10';
import { migrateV8ToV9 } from './migrate-v8-to-v9';
import { migrateV7ToV8 } from './migrate-v7-to-v8';
import { EARLIER_MIGRATION_STEPS } from './earlier-migration-steps';

export const MIGRATIONS: readonly (((data: unknown) => unknown) | undefined)[] = [
  ...EARLIER_MIGRATION_STEPS,
  migrateV7ToV8,
  migrateV8ToV9,
  migrateV9ToV10,
  migrateV10ToV11,
  migrateV11ToV12,
  migrateV12ToV13,
];
