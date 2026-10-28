import { removeKeyCandidate } from './remove-key-candidate';
import { preserveWireProtection } from '@domain/wires/protection';
import type { Project } from '@domain';

export function removeKeys(
  project: Project,
  input: { readonly keyIds: readonly string[] },
): Project {
  let next = project;
  for (const keyId of input.keyIds) {
    next = removeKeyCandidate(next, { keyId });
  }
  return preserveWireProtection(project, next);
}
