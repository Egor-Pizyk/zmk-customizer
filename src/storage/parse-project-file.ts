import { serializeProject } from './serialize-project';
import * as z from 'zod';
import { PROJECT_BUDGET } from './project-budget';
import type { Project, Result } from '../domain/types';
import { CURRENT_SCHEMA_VERSION, migrateProject } from './migrate-project';
import { projectSchema } from './project-schema';

export type ProjectFileIssue = { readonly path: string; readonly message: string };

export type ProjectFileError =
  | { readonly kind: 'not-json' }
  | { readonly kind: 'not-project'; readonly issues: readonly ProjectFileIssue[] }
  | { readonly kind: 'newer-version' }
  | { readonly kind: 'too-large' };

const versionSchema = z.object({ schemaVersion: z.int().positive() });

function parseJson(raw: string): Result<unknown, ProjectFileError> {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: { kind: 'not-json' } };
  }
}

function toNotProject(error: z.ZodError): ProjectFileError {
  const issues = error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return { kind: 'not-project', issues };
}

// One trust boundary for files and stored state (contracts/project-file.md "Reading rules").
export function parseProjectFile(raw: string): Result<Project, ProjectFileError> {
  if (
    raw.length > PROJECT_BUDGET.bytes ||
    new TextEncoder().encode(raw).length > PROJECT_BUDGET.bytes
  ) {
    return { ok: false, error: { kind: 'too-large' } };
  }
  const json = parseJson(raw);
  if (!json.ok) {
    return json;
  }
  const version = versionSchema.safeParse(json.value);
  if (!version.success) {
    // A non-object (e.g. `[]`) fails at the root; report it where the user can act on it.
    const issues = [{ path: 'schemaVersion', message: 'Expected a whole number of 1 or more' }];
    return { ok: false, error: { kind: 'not-project', issues } };
  }
  if (version.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, error: { kind: 'newer-version' } };
  }
  const migrated = migrateProject(json.value, { fromVersion: version.data.schemaVersion });
  const project = projectSchema.safeParse(migrated);
  if (!project.success) {
    return { ok: false, error: toNotProject(project.error) };
  }
  if (!serializeProject(project.data).ok) {
    return { ok: false, error: { kind: 'too-large' } };
  }
  return { ok: true, value: project.data };
}
