import * as z from 'zod';
import type { Project } from '../domain/types';

// Describes only the current schemaVersion; older files are migrated before parsing (research R8).
export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string(),
  shieldName: z.string().exactOptional(),
}) satisfies z.ZodType<Project>;
