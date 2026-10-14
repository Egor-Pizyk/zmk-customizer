import type { Project } from '@domain';

// A keymap keeps at least one layer. Keys that point at the removed layer keep their layerId and
// are reported until fixed or the removal is undone (spec 007 FR-012).
export function removeLayer(project: Project, input: { readonly layerIndex: number }): Project {
  if (project.layers.length <= 1 || project.layers[input.layerIndex] === undefined) {
    return project;
  }
  return { ...project, layers: project.layers.toSpliced(input.layerIndex, 1) };
}
