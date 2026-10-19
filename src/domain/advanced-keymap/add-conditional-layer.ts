import type { Project } from '@domain';
import { createEntityId } from '@domain/project';

export function addConditionalLayer(project: Project): Project {
  if (project.conditionalLayers.length >= 128) {
    return project;
  }
  const id = createEntityId({
    prefix: 'q',
    existingIds: project.conditionalLayers.map((rule) => rule.id),
  });
  return {
    ...project,
    conditionalLayers: [
      ...project.conditionalLayers,
      {
        id,
        ifLayerIds: project.layers.slice(0, 2).map((layer) => layer.id),
        thenLayerId: project.layers[2]?.id ?? 'l0',
      },
    ],
  };
}
