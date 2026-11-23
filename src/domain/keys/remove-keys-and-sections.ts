import { removeWireSections } from '@domain/wires/editing';
import { removeKeyCandidate } from './remove-key-candidate';
import { validateWireProtection } from '@domain/wires/protection';
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
  if (!result.ok) {
    return result;
  }
  let candidate = result.value;
  for (const keyId of input.keyIds) {
    candidate = removeKeyCandidate(candidate, { keyId });
  }
  const issue = validateWireProtection(project, candidate)[0];
  return issue === undefined ? { ok: true, value: candidate } : { ok: false, error: issue.message };
}
