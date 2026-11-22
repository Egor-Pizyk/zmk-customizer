import { preserveWireProtection } from '@domain/wires/protection';
import { removeKeyCandidate } from './remove-key-candidate';
import type { Project } from '@domain';

export function removeKey(project: Project, input: { readonly keyId: string }): Project {
  return preserveWireProtection(project, removeKeyCandidate(project, input));
}
