import type { Key } from '../../domain/types';
import { isKeyCellInMarquee } from '../canvas/marquee-select';
import type { Marquee } from '../canvas/marquee-layer';

export function findKeysInMarquee(keys: readonly Key[], marquee: Marquee): readonly string[] {
  return keys.filter((key) => isKeyCellInMarquee(key, marquee)).map((key) => key.id);
}
