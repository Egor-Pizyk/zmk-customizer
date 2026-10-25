import { getKeyCenter, getKeyGeometry } from '@domain/geometry';
import { setKeyGeometries } from './set-key-geometries';
import type { Key, KeyGeometry, Project, WirePoint } from '@domain';

export type LayoutEdit = {
  readonly keyIds: readonly string[];
  readonly offset: WirePoint;
  readonly geometry: Partial<Omit<KeyGeometry, 'xU' | 'yU'>>;
};

export function editLayout(project: Project, input: LayoutEdit): Project {
  const changes = project.keys
    .filter((key) => input.keyIds.includes(key.id))
    .map((key) => {
      const rotation = getRotationPatch(key, input.geometry);
      const geometry = { ...getKeyGeometry(key), ...rotation };
      const origin =
        rotation.rotationOriginXU !== undefined ||
        geometry.rotationDeg !== 0 ||
        key.rotationOriginXU !== undefined ||
        key.rotationOriginYU !== undefined
          ? {
              rotationOriginXU: geometry.rotationOriginXU + input.offset.xU,
              rotationOriginYU: geometry.rotationOriginYU + input.offset.yU,
            }
          : {};
      return {
        keyId: key.id,
        geometry: {
          ...rotation,
          xU: geometry.xU + input.offset.xU,
          yU: geometry.yU + input.offset.yU,
          ...origin,
          ...input.geometry,
        },
      };
    });
  return setKeyGeometries(project, { changes });
}

function getRotationPatch(key: Key, patch: LayoutEdit['geometry']): Partial<KeyGeometry> {
  const geometry = getKeyGeometry(key);
  if (
    patch.rotationDeg === undefined ||
    patch.rotationDeg === geometry.rotationDeg ||
    patch.rotationOriginXU !== undefined ||
    patch.rotationOriginYU !== undefined
  ) {
    return {};
  }
  const center = getKeyCenter(key);
  return {
    xU: center.xU - geometry.widthU / 2,
    yU: center.yU - geometry.heightU / 2,
    rotationOriginXU: center.xU,
    rotationOriginYU: center.yU,
  };
}
