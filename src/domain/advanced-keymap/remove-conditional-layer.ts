import type { Project } from '@domain';

export function removeConditionalLayer(project: Project, id: string): Project {
  if (!project.conditionalLayers.some((entry) => entry.id === id)) {
    return project;
  }
  return {
    ...project,
    conditionalLayers: project.conditionalLayers.filter((entry) => entry.id !== id),
  };
}
