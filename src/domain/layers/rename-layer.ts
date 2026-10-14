import type { Project } from '@domain';

// Stored as typed; validateLayers reports names the keymap cannot use (spec 007 FR-005, FR-006).
export function renameLayer(
  project: Project,
  input: { readonly layerIndex: number; readonly name: string },
): Project {
  const layer = project.layers[input.layerIndex];
  if (layer === undefined || layer.name === input.name) {
    return project;
  }
  return {
    ...project,
    layers: project.layers.with(input.layerIndex, { ...layer, name: input.name }),
  };
}
