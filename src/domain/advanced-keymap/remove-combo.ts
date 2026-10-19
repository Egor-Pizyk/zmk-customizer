import type { Project } from '@domain';

export function removeCombo(project: Project, id: string): Project {
  if (!project.combos.some((entry) => entry.id === id)) {
    return project;
  }
  return { ...project, combos: project.combos.filter((entry) => entry.id !== id) };
}
