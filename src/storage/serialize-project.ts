import type { Project, Result } from '../domain/types';
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
  return { ok: true, value: `${JSON.stringify(parsed.data, null, 2)}\n` };
}
