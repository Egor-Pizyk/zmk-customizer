import { createEntityId } from '../project/create-entity-id';
import { toLayerNodeName } from './to-layer-node-name';
import type { Binding, Project } from '../types';

const PASS_THROUGH: Binding = { kind: 'trans' };

function findFreeName(project: Project): string {
  const takenNodeNames = new Set(project.layers.map((layer) => toLayerNodeName(layer.name)));
  let number = project.layers.length;
  while (takenNodeNames.has(toLayerNodeName(`Layer ${number}`))) {
    number += 1;
  }
  return `Layer ${number}`;
}

// A new layer passes every key through to the layers below (spec 007 Q2). Its id is never one a
// binding still points at: a key on a deleted layer stays reported, never silently retargeted (R1).
export function addLayer(
  project: Project,
  input?: { readonly reservedLayerIds: readonly string[] },
): Project {
  const referencedIds = project.layers.flatMap((layer) =>
    Object.values(layer.bindings).flatMap((binding) =>
      'layerId' in binding ? [binding.layerId] : [],
    ),
  );
  const id = createEntityId({
    prefix: 'l',
    existingIds: [
      ...project.layers.map((layer) => layer.id),
      ...referencedIds,
      ...(input?.reservedLayerIds ?? []),
    ],
  });
  const bindings = Object.fromEntries(project.keys.map((key) => [key.id, PASS_THROUGH]));
  return { ...project, layers: [...project.layers, { id, name: findFreeName(project), bindings }] };
}
