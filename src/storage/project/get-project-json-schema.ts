import * as z from 'zod';
import { projectSchema } from './project-schema';

// JSON Schema represents structure; importer refinements and electrical analysis still apply.
export function getProjectJsonSchema() {
  return z.toJSONSchema(projectSchema, { io: 'input' });
}
