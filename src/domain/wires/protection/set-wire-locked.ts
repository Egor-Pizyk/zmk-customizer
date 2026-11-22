import type { Project } from '@domain';

export function setWireLocked(
  project: Project,
  input: { readonly wireId: string; readonly isLocked: boolean },
): Project {
  const target = project.wires.find((wire) => wire.id === input.wireId);
  if (target === undefined || (target.locked === true) === input.isLocked) {
    return project;
  }
  const { locked: _removed, ...rest } = target;
  const replacement = input.isLocked ? { ...rest, locked: true as const } : rest;
  return {
    ...project,
    wires: project.wires.map((wire) => (wire.id === input.wireId ? replacement : wire)),
  };
}
