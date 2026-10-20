import { canAddWire, captureWireContacts } from '@domain/wires';
import { createEntityId, getProjectResourceError } from '@domain/project';
import type { Project, WireEnd, WirePoint } from '@domain';

// Guarded: ends that fail canAddWire would be rejected by the schema on reload,
// so the invalid wire is refused and the project is returned unchanged.
export function addWire(
  project: Project,
  input: { readonly start: WireEnd; readonly end: WireEnd; readonly bends: readonly WirePoint[] },
): Project {
  if (canAddWire(project, input) !== 'ok') {
    return project;
  }
  const id = createEntityId({ prefix: 'w', existingIds: project.wires.map((wire) => wire.id) });
  const next = {
    ...project,
    wires: [...project.wires, captureWireContacts(project, { id, ...input })],
  };
  return getProjectResourceError(next) === undefined ? next : project;
}
