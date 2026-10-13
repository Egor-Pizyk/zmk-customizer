import { getKeyGeometry } from '../../domain/get-key-geometry';
import type { Key } from '../../domain/types';

export function formatKeyTransform(key: Key): string {
  const geometry = getKeyGeometry(key);
  return `rotate(${geometry.rotationDeg} ${geometry.rotationOriginXU} ${geometry.rotationOriginYU})`;
}
