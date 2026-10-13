import { getKeyCenter } from '@domain';
import type { Key } from '@domain';

export type Direction = 'left' | 'right' | 'up' | 'down';

// Arrow-key navigation (accessibility.md "Canvas"): the closest key whose center lies in the
// pressed direction; sideways distance counts double so a straight neighbour wins.
export function findNearestKey(
  keys: readonly Key[],
  input: { readonly fromKeyId: string; readonly direction: Direction },
): Key | undefined {
  const from = keys.find((key) => key.id === input.fromKeyId);
  if (from === undefined) {
    return undefined;
  }
  const fromCenter = getKeyCenter(from);
  let nearest: Key | undefined;
  let nearestScore = Number.POSITIVE_INFINITY;
  for (const key of keys) {
    const center = getKeyCenter(key);
    const dx = center.xU - fromCenter.xU;
    const dy = center.yU - fromCenter.yU;
    const isHorizontal = input.direction === 'left' || input.direction === 'right';
    const along = isHorizontal ? dx : dy;
    const sideways = Math.abs(isHorizontal ? dy : dx);
    const forward = input.direction === 'left' || input.direction === 'up' ? -along : along;
    const score = forward + sideways * 2;
    if (key.id !== from.id && forward > 0 && score < nearestScore) {
      nearest = key;
      nearestScore = score;
    }
  }
  return nearest;
}
