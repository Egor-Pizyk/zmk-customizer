import type { Project } from '@domain';
import { createEntityId } from '@domain/project';

export function addCombo(
  project: Project,
  input: { readonly name: string; readonly keyIds: readonly string[] },
): Project {
  if (project.combos.length >= 128) {
    return project;
  }
  const id = createEntityId({ prefix: 'c', existingIds: project.combos.map((combo) => combo.id) });
  return {
    ...project,
    combos: [
      ...project.combos,
      {
        id,
        name: input.name,
        keyIds: input.keyIds,
        timeoutMs: 50,
        layerIds: [],
        binding: { kind: 'kp', key: { keycode: 'ESC', modifiers: [] } },
      },
    ],
  };
}
