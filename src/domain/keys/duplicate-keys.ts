import { createEntityId } from '@domain/project';
import { getKeyCorners, getKeyGeometry } from '@domain/geometry';
import type { Key, Project } from '@domain';

export function duplicateKeys(
  project: Project,
  input: { readonly keyIds: readonly string[]; readonly maxKeyCount: number },
): Project {
  const sources = project.keys.filter((key) => input.keyIds.includes(key.id));
  if (sources.length === 0 || project.keys.length + sources.length > input.maxKeyCount) {
    return project;
  }
  let rightU = -Infinity;
  let leftU = Infinity;
  for (const key of project.keys) {
    for (const point of getKeyCorners(key)) {
      rightU = Math.max(rightU, point.xU);
    }
  }
  for (const key of sources) {
    for (const point of getKeyCorners(key)) {
      leftU = Math.min(leftU, point.xU);
    }
  }
  const deltaXU = rightU + 1 - leftU;
  const existingIds = project.keys.map((key) => key.id);
  const copies = sources.map((key) => {
    const id = createEntityId({ prefix: 'k', existingIds });
    existingIds.push(id);
    const geometry = getKeyGeometry(key);
    return {
      ...key,
      id,
      xU: key.xU + deltaXU,
      rotationOriginXU: geometry.rotationOriginXU + deltaXU,
    };
  });
  const layers = copyBindings(project, sources, copies);
  return { ...project, keys: [...project.keys, ...copies], layers };
}

function copyBindings(project: Project, sources: readonly Key[], copies: readonly Key[]) {
  return project.layers.map((layer) => {
    const bindings = { ...layer.bindings };
    for (const [index, source] of sources.entries()) {
      const copy = copies[index];
      const binding = layer.bindings[source.id];
      if (copy !== undefined && binding !== undefined) {
        bindings[copy.id] = binding;
      }
    }
    return { ...layer, bindings };
  });
}
