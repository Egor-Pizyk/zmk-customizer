import { getKeyGeometry } from './get-key-geometry';
import { rotatePoint } from './rotate-point';
import type { Key, WirePoint } from '../types';

export function getKeyCenter(key: Key): WirePoint {
  const geometry = getKeyGeometry(key);
  return rotatePoint(
    { xU: key.xU + geometry.widthU / 2, yU: key.yU + geometry.heightU / 2 },
    {
      rotationDeg: geometry.rotationDeg,
      origin: { xU: geometry.rotationOriginXU, yU: geometry.rotationOriginYU },
    },
  );
}
