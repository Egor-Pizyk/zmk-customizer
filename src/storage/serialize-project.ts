import type { Project } from '../domain/types';
import { projectSchema } from './project-schema';

// Parsing fixes the key order to the schema order however the object was built (research R8).
export function serializeProject(project: Project): string {
  return `${JSON.stringify(projectSchema.parse(project), null, 2)}\n`;
}
