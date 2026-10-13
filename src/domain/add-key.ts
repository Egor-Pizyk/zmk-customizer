import { createEntityId } from './create-entity-id';
import type { Project, WirePoint } from './types';

export function addKey(
  project: Project,
  input: { readonly position: WirePoint; readonly maxKeyCount?: number },
): Project {
  if (input.maxKeyCount !== undefined && project.keys.length >= input.maxKeyCount) {
    return project;
  }
  const id = createEntityId({ prefix: 'k', existingIds: project.keys.map((key) => key.id) });
  return { ...project, keys: [...project.keys, { id, ...input.position }] };
}
