import { isSameBinding } from '@domain/bindings';
import { setLayerBindings } from './set-layer-bindings';
import type { Binding, Project } from '@domain';

/**
 * Applies `change` to the binding of each listed key; `undefined` from `change` keeps it. The
 * same project comes back when nothing changed, so a commit adds no empty undo step.
 */
export function mapLayerBindings(
  project: Project,
  input: { readonly layerIndex: number; readonly keyIds: readonly string[] },
  change: (binding: Binding | undefined) => Binding | undefined,
): Project {
  const layer = project.layers[input.layerIndex];
  if (layer === undefined) {
    return project;
  }
  const changes = input.keyIds.flatMap((keyId) => {
    const current = layer.bindings[keyId];
    const next = project.keys.some((key) => key.id === keyId) ? change(current) : undefined;
    return next === undefined || isSameBinding(next, current) ? [] : [[keyId, next] as const];
  });
  if (changes.length === 0) {
    return project;
  }
  const order = new Map(project.keys.map((key, index) => [key.id, index]));
  const ordered = changes.toSorted(
    ([first], [second]) => (order.get(first) ?? 0) - (order.get(second) ?? 0),
  );
  const bindings = { ...layer.bindings, ...Object.fromEntries(ordered) };
  return setLayerBindings(project, { layerIndex: input.layerIndex, bindings });
}
