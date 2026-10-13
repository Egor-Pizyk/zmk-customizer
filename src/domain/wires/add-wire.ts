import { canAddWire } from './can-add-wire';
import { createEntityId } from '../project/create-entity-id';
import type { Project, WireEnd, WirePoint } from '../types';

// Guarded: ends that fail canAddWire would be rejected by the schema on reload,
// so the invalid wire is refused and the project is returned unchanged.
export function addWire(
  project: Project,
  input: { readonly start: WireEnd; readonly end: WireEnd; readonly bends: readonly WirePoint[] },
): Project {
  if (canAddWire(project, { start: input.start, end: input.end }) !== 'ok') {
    return project;
  }
  const id = createEntityId({ prefix: 'w', existingIds: project.wires.map((wire) => wire.id) });
  return { ...project, wires: [...project.wires, { id, ...input }] };
}
