import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import { removeOrphanWires } from './remove-orphan-wires';
import type { Project } from './types';

export function removeWire(project: Project, input: { readonly wireId: string }): Project {
  return pruneInsulatedCrossings(removeOrphanWires(project, { removedWireIds: [input.wireId] }));
}
