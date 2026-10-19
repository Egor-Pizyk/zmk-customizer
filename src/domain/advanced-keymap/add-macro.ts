import type { Project } from '@domain';
import { createEntityId } from '@domain/project';
import { getProjectBindings } from '@domain/behaviors';

export function addMacro(
  project: Project,
  input: { readonly name: string; readonly reservedIds?: readonly string[] },
): Project {
  if (project.macros.length >= 128) {
    return project;
  }
  const bindings = getProjectBindings(project);
  const references = bindings.flatMap((binding) =>
    binding.kind === 'macro' ? [binding.macroId] : [],
  );
  const id = createEntityId({
    prefix: 'm',
    existingIds: [
      ...project.macros.map((macro) => macro.id),
      ...references,
      ...(input.reservedIds ?? []),
    ],
  });
  return {
    ...project,
    macros: [
      ...project.macros,
      {
        id,
        name: input.name,
        waitMs: 15,
        tapMs: 30,
        steps: [
          { id: 's1', kind: 'tap', binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
        ],
      },
    ],
  };
}
