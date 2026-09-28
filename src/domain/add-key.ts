import { createEntityId } from './create-entity-id';
import type { Project, WirePoint } from './types';

export function addKey(project: Project, input: { readonly position: WirePoint }): Project {
  const id = createEntityId({ prefix: 'k', existingIds: project.keys.map((key) => key.id) });
  return { ...project, keys: [...project.keys, { id, ...input.position }] };
}
