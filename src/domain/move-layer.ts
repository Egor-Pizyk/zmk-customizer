import type { Project } from './types';

// Layer behaviors point at Layer.id, so moving rewrites no binding (spec 007 FR-011, R1).
export function moveLayer(
  project: Project,
  input: { readonly layerIndex: number; readonly toIndex: number },
): Project {
  const { layerIndex, toIndex } = input;
  const layer = project.layers[layerIndex];
  const isInside = toIndex >= 0 && toIndex < project.layers.length;
  if (layer === undefined || !isInside || toIndex === layerIndex) {
    return project;
  }
  const layers = project.layers.toSpliced(layerIndex, 1).toSpliced(toIndex, 0, layer);
  return { ...project, layers };
}
