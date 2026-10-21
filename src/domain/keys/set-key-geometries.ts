import { getKeyGeometry } from '@domain/geometry';
import { preserveKeyWiring } from './preserve-key-wiring';
import type { KeyGeometry, Project } from '@domain';

export type KeyGeometryChange = { readonly keyId: string; readonly geometry: Partial<KeyGeometry> };

export function setKeyGeometries(
  project: Project,
  input: { readonly changes: readonly KeyGeometryChange[] },
): Project {
  const changeByKeyId = new Map(input.changes.map((change) => [change.keyId, change.geometry]));
  const keys = project.keys.map((key) => {
    const patch = changeByKeyId.get(key.id);
    if (patch === undefined) {
      return key;
    }
    const geometry = getKeyGeometry(key);
    const next = { ...geometry, ...patch };
    return geometry.xU === next.xU &&
      geometry.yU === next.yU &&
      geometry.widthU === next.widthU &&
      geometry.heightU === next.heightU &&
      geometry.rotationDeg === next.rotationDeg &&
      geometry.rotationOriginXU === next.rotationOriginXU &&
      geometry.rotationOriginYU === next.rotationOriginYU
      ? key
      : { ...key, ...patch };
  });
  return keys.every((key, index) => key === project.keys[index])
    ? project
    : preserveKeyWiring(project, { ...project, keys });
}
