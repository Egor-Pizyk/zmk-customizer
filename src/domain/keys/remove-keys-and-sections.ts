import { removeWireSections } from '@domain/wires/editing';
import { removeKeys } from './remove-keys';
import type { Project, Result } from '@domain';

export function removeKeysAndSections(
  project: Project,
  input: {
    readonly base: Project;
    readonly keyIds: readonly string[];
    readonly sectionIds: readonly string[];
  },
): Result<Project, string> {
  const result = removeWireSections(project, input);
  return result.ok ? { ok: true, value: removeKeys(result.value, input) } : result;
}
