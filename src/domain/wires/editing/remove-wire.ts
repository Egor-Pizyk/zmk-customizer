import { pruneInsulatedCrossings } from '@domain/crossings';
import { removeOrphanWires } from '@domain/wires';
import type { Project } from '@domain';

export function removeWire(project: Project, input: { readonly wireId: string }): Project {
  return pruneInsulatedCrossings(removeOrphanWires(project, { removedWireIds: [input.wireId] }));
}
