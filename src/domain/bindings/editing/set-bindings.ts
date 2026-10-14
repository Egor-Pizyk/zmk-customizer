import { isSameBinding } from '@domain/bindings';
import { setLayerBindings } from '@domain/layers';
import type { Binding, Project } from '@domain';

// One action for every selected key, one undo step (spec 004 FR-015, FR-018 paste).
export function setBindings(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly binding: Binding;
  },
): Project {
  const layer = project.layers[input.layerIndex];
  if (layer === undefined) {
    return project;
  }
  const order = new Map(project.keys.map((key, index) => [key.id, index]));
  const changedKeyIds = input.keyIds
    .filter(
      (keyId) =>
        project.keys.some((key) => key.id === keyId) &&
        !isSameBinding(layer.bindings[keyId], input.binding),
    )
    // New entries append in key order so the same set serializes identically (deterministic).
    .toSorted((first, second) => (order.get(first) ?? 0) - (order.get(second) ?? 0));
  if (changedKeyIds.length === 0) {
    return project;
  }
  const bindings = {
    ...layer.bindings,
    ...Object.fromEntries(changedKeyIds.map((keyId) => [keyId, input.binding])),
  };
  return setLayerBindings(project, { layerIndex: input.layerIndex, bindings });
}
