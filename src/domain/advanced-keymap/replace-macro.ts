import type { Project, Macro } from '@domain';

export function replaceMacro(project: Project, value: Macro): Project {
  const existing = project.macros.find((entry) => entry.id === value.id);
  if (existing === undefined || JSON.stringify(existing) === JSON.stringify(value)) {
    return project;
  }
  return {
    ...project,
    macros: project.macros.map((entry) => (entry.id === value.id ? value : entry)),
  };
}
