import type { Project, Combo } from '@domain';

export function replaceCombo(project: Project, value: Combo): Project {
  const existing = project.combos.find((entry) => entry.id === value.id);
  if (existing === undefined || JSON.stringify(existing) === JSON.stringify(value)) {
    return project;
  }
  return {
    ...project,
    combos: project.combos.map((entry) => (entry.id === value.id ? value : entry)),
  };
}
