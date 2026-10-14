import type { Key } from '@domain';
import { isKeyCellInMarquee } from '@ui/canvas/logic';
import type { Marquee } from '@ui/canvas/components';

export function findKeysInMarquee(keys: readonly Key[], marquee: Marquee): readonly string[] {
  return keys.filter((key) => isKeyCellInMarquee(key, marquee)).map((key) => key.id);
}
