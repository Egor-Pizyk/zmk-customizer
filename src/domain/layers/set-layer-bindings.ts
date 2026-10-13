import { isSameBinding } from '../bindings/is-same-binding';
import type { Layer, Project } from '../types';

/** Low-level layer setter; drops bindings for keys that no longer exist (data-model.md). */
export function setLayerBindings(
  project: Project,
  input: { readonly layerIndex: number; readonly bindings: Layer['bindings'] },
): Project {
  const layer = project.layers[input.layerIndex];
  if (layer === undefined || layer.bindings === input.bindings) {
    return project;
  }
  const keyIds = new Set(project.keys.map((key) => key.id));
  const filteredEntries = Object.entries(input.bindings).filter(([keyId]) => keyIds.has(keyId));
  const filtered: Layer['bindings'] = Object.fromEntries(filteredEntries);
  const isUnchanged =
    Object.keys(layer.bindings).length === filteredEntries.length &&
    filteredEntries.every(([keyId, binding]) => isSameBinding(layer.bindings[keyId], binding));
  if (isUnchanged) {
    return project;
  }
  return {
    ...project,
    layers: project.layers.with(input.layerIndex, { ...layer, bindings: filtered }),
  };
}
