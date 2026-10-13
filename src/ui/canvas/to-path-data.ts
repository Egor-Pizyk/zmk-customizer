import type { WirePoint } from '@domain';

export function toPathData(points: readonly WirePoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.xU} ${point.yU}`)
    .join(' ');
}
