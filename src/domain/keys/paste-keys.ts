import { createEntityId } from '@domain/project';
import { getKeyCorners, getKeyGeometry } from '@domain/geometry';
import type { Key, Project } from '@domain';
import type { KeyClipboard } from './copy-keys';

export function pasteKeys(
  project: Project,
  input: { readonly clipboard: KeyClipboard; readonly maxKeyCount: number },
): Project {
  const sources = input.clipboard.keys;
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
  const deltaXU = project.keys.length === 0 ? 0 : rightU + 1 - leftU;
  const existingIds = project.keys.map((key) => key.id);
  const copies = sources.map((key) => {
    const id = createEntityId({ prefix: 'k', existingIds });
    existingIds.push(id);
    return translateKey(key, { id, deltaXU });
  });
  const layers = copyBindings(project, { clipboard: input.clipboard, copies });
  return { ...project, keys: [...project.keys, ...copies], layers };
}

function copyBindings(
  project: Project,
  input: { readonly clipboard: KeyClipboard; readonly copies: readonly Key[] },
) {
  return project.layers.map((layer) => {
    const bindings = { ...layer.bindings };
    for (const [index, source] of input.clipboard.keys.entries()) {
      const copy = input.copies[index];
      const binding = input.clipboard.layers.find((entry) => entry.id === layer.id)?.bindings[
        source.id
      ];
      if (copy !== undefined && binding !== undefined) {
        bindings[copy.id] = binding;
      }
    }
    return { ...layer, bindings };
  });
}

function translateKey(key: Key, input: { readonly id: string; readonly deltaXU: number }): Key {
  const geometry = getKeyGeometry(key);
  return {
    ...key,
    id: input.id,
    xU: key.xU + input.deltaXU,
    rotationOriginXU: geometry.rotationOriginXU + input.deltaXU,
  };
}
