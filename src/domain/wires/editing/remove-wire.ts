import { preserveWireProtection } from '@domain/wires/protection';
import { removeOrphanWires } from '@domain/wires';
import { pruneInsulatedCrossings } from '@domain/crossings';
import type { Project } from '@domain';

function removeWireCandidate(project: Project, input: { readonly wireId: string }): Project {
  return pruneInsulatedCrossings(removeOrphanWires(project, { removedWireIds: [input.wireId] }));
}

export function removeWire(
  project: Project,
  input: Parameters<typeof removeWireCandidate>[1],
): Project {
  return preserveWireProtection(project, removeWireCandidate(project, input));
}
