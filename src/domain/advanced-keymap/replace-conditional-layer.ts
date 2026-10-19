import type { Project, ConditionalLayer } from '@domain';

export function replaceConditionalLayer(project: Project, value: ConditionalLayer): Project {
  const existing = project.conditionalLayers.find((entry) => entry.id === value.id);
  if (existing === undefined || JSON.stringify(existing) === JSON.stringify(value)) {
    return project;
  }
  return {
    ...project,
    conditionalLayers: project.conditionalLayers.map((entry) =>
      entry.id === value.id ? value : entry,
    ),
  };
}
