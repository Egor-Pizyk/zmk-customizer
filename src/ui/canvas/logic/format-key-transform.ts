import { getKeyGeometry } from '@domain/geometry';
import type { Key } from '@domain';

export function formatKeyTransform(key: Key): string {
  const geometry = getKeyGeometry(key);
  return `rotate(${geometry.rotationDeg} ${geometry.rotationOriginXU} ${geometry.rotationOriginYU})`;
}
