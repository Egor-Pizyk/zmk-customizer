import { migrateV6ToV7 } from './migrate-v6-to-v7';
import { migrateV5ToV6 } from './migrate-v5-to-v6';
import { migrateV4ToV5 } from './migrate-v4-to-v5';
import { migrateV3ToV4 } from './migrate-v3-to-v4';
import { migrateV1ToV2 } from './migrate-v1-to-v2';
import { migrateV2ToV3 } from './migrate-v2-to-v3';

export const EARLIER_MIGRATION_STEPS = [
  undefined,
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV4ToV5,
  migrateV5ToV6,
  migrateV6ToV7,
] as const;
