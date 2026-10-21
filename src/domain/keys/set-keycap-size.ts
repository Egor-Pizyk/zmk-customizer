import type { Project } from '@domain';
import { getKeyGeometry } from '@domain/geometry';
import { setKeyGeometries } from './set-key-geometries';

export type KeycapSizeInput = {
  readonly keyIds: readonly string[];
  readonly sizeId: string;
  readonly sizes: readonly {
    readonly id: string;
    readonly widthU: number;
    readonly heightU: number;
  }[];
};

export function setKeycapSize(project: Project, input: KeycapSizeInput): Project {
  const size = input.sizes.find((entry) => entry.id === input.sizeId);
  if (size === undefined) {
    return project;
  }
  const changes = project.keys
    .filter((key) => input.keyIds.includes(key.id))
    .map((key) => {
      const geometry = getKeyGeometry(key);
      return {
        keyId: key.id,
        geometry: {
          xU: geometry.xU + (geometry.widthU - size.widthU) / 2,
          yU: geometry.yU + (geometry.heightU - size.heightU) / 2,
          widthU: size.widthU,
          heightU: size.heightU,
        },
      };
    });
  return setKeyGeometries(project, { changes });
}
