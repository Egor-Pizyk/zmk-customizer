import type { Key, KeyGeometry } from './types';

export function getKeyGeometry(key: Key): KeyGeometry {
  return {
    xU: key.xU,
    yU: key.yU,
    widthU: key.widthU ?? 1,
    heightU: key.heightU ?? 1,
    rotationDeg: key.rotationDeg ?? 0,
    rotationOriginXU: key.rotationOriginXU ?? 0,
    rotationOriginYU: key.rotationOriginYU ?? 0,
  };
}
