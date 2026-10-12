import type { Project, Result } from '../domain/types';
import { PROJECT_BUDGET } from './project-budget';
import { parseProjectFile } from './parse-project-file';
import type { ProjectFileError } from './parse-project-file';

export const MAX_PROJECT_FILE_BYTES = PROJECT_BUDGET.bytes;

async function readText(file: File): Promise<Result<string, ProjectFileError>> {
  try {
    return { ok: true, value: await file.text() };
  } catch {
    return { ok: false, error: { kind: 'not-json' } };
  }
}

export async function readImportFile(file: File): Promise<Result<Project, ProjectFileError>> {
  if (file.size > MAX_PROJECT_FILE_BYTES) {
    return { ok: false, error: { kind: 'too-large' } };
  }
  const text = await readText(file);
  return text.ok ? parseProjectFile(text.value) : text;
}
