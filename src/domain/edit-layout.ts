import { getKeyGeometry } from './get-key-geometry';
import { setKeyGeometries } from './set-key-geometries';
import type { KeyGeometry, Project, WirePoint } from './types';

export type LayoutEdit = {
  readonly keyIds: readonly string[];
  readonly offset: WirePoint;
  readonly geometry: Partial<Omit<KeyGeometry, 'xU' | 'yU'>>;
};

export function editLayout(project: Project, input: LayoutEdit): Project {
  const changes = project.keys
    .filter((key) => input.keyIds.includes(key.id))
    .map((key) => {
      const geometry = getKeyGeometry(key);
      const origin =
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
          xU: key.xU + input.offset.xU,
          yU: key.yU + input.offset.yU,
          ...origin,
          ...input.geometry,
        },
      };
    });
  return setKeyGeometries(project, { changes });
}
