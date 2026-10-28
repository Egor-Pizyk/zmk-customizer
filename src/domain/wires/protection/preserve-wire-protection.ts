import { validateWireProtection } from './validate-wire-protection';
import type { Project } from '@domain';

/** Public edit owners validate the complete candidate so a group cannot partially succeed. */
export function preserveWireProtection(base: Project, candidate: Project): Project {
  return validateWireProtection(base, candidate).length === 0 ? candidate : base;
}
