import type { CustomBehavior, Project } from '@domain';
import { createBehavior } from './create-behavior';
import { getProjectBindings } from './get-project-bindings';

export function addBehavior(
  project: Project,
  input: {
    readonly kind: CustomBehavior['kind'];
    readonly name: string;
    readonly reservedIds?: readonly string[];
  },
): Project {
  if (project.behaviors.length >= 128) {
    return project;
  }
  const bindings = getProjectBindings(project);
  const ids = [
    ...(input.reservedIds ?? []),
    ...project.behaviors.map((behavior) => behavior.id),
    ...bindings.flatMap((binding) => (binding.kind === 'custom' ? [binding.behaviorId] : [])),
  ];
  let next = 0n;
  for (const id of ids) {
    if (!/^b\d+$/u.test(id)) {
      continue;
    }
    const value = BigInt(id.slice(1));
    if (value >= next) {
      next = value + 1n;
    }
  }
  return {
    ...project,
    behaviors: [...project.behaviors, createBehavior({ ...input, id: `b${next}` })],
  };
}
