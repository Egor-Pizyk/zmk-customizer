import { getKeyGeometry } from './get-key-geometry';
import { rotatePoint } from './rotate-point';
import type { Key, WirePoint } from '../types';

export function getKeyCorners(key: Key): readonly WirePoint[] {
  const geometry = getKeyGeometry(key);
  return [
    { xU: key.xU, yU: key.yU },
    { xU: key.xU + geometry.widthU, yU: key.yU },
    { xU: key.xU + geometry.widthU, yU: key.yU + geometry.heightU },
    { xU: key.xU, yU: key.yU + geometry.heightU },
  ].map((point) =>
    rotatePoint(point, {
      rotationDeg: geometry.rotationDeg,
      origin: { xU: geometry.rotationOriginXU, yU: geometry.rotationOriginYU },
    }),
  );
}
