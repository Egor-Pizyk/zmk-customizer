import { createEntityId } from './create-entity-id';
import type { Project, WireEnd, WirePoint } from './types';

// No insulation prune: a new wire cannot remove an existing crossing.
export function addWire(
  project: Project,
  input: { readonly start: WireEnd; readonly end: WireEnd; readonly bends: readonly WirePoint[] },
): Project {
  const id = createEntityId({ prefix: 'w', existingIds: project.wires.map((wire) => wire.id) });
  return { ...project, wires: [...project.wires, { id, ...input }] };
}
