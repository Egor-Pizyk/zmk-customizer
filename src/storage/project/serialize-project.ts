import { getProjectJson } from '@domain/project';
import type { Project, Result } from '@domain';
import { PROJECT_BUDGET } from './project-budget';
import { projectSchema } from './project-schema';

// Parsing fixes the key order to the schema order however the object was built (research R8).
// safeParse: a domain-built project that fails the schema is reported, never thrown,
// so autosave outside the error boundary cannot crash on it (P0.5).
export function serializeProject(project: Project): Result<string, string> {
  const parsed = projectSchema.safeParse(project);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first === undefined ? '' : first.path.map(String).join('.');
    const detail = first === undefined ? 'unknown schema error' : first.message;
    return { ok: false, error: path === '' ? detail : `${path}: ${detail}` };
  }
  const value = getProjectJson(parsed.data);
  if (new TextEncoder().encode(value).length > PROJECT_BUDGET.bytes) {
    return { ok: false, error: 'Project exceeds the saved JSON byte budget' };
  }
  return { ok: true, value };
}
