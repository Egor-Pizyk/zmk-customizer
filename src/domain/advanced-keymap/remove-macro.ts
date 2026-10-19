import type { Project } from '@domain';

export function removeMacro(project: Project, id: string): Project {
  if (!project.macros.some((entry) => entry.id === id)) {
    return project;
  }
  return { ...project, macros: project.macros.filter((entry) => entry.id !== id) };
}
