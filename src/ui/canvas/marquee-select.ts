import { doPolygonsOverlap } from '../../domain/do-polygons-overlap';
import { getKeyCorners } from '../../domain/get-key-corners';
import type { Key, WirePoint } from '../../domain/types';
import type { Marquee } from './marquee-layer';

type Position = Pick<
  Key,
  'xU' | 'yU' | 'widthU' | 'heightU' | 'rotationDeg' | 'rotationOriginXU' | 'rotationOriginYU'
>;

// A zero-size point (wire bend, free end) is inside when it lies within the rect.
export function isPointInMarquee(point: WirePoint, marquee: Marquee): boolean {
  const minX = Math.min(marquee.start.xU, marquee.end.xU);
  const maxX = Math.max(marquee.start.xU, marquee.end.xU);
  const minY = Math.min(marquee.start.yU, marquee.end.yU);
  const maxY = Math.max(marquee.start.yU, marquee.end.yU);
  return point.xU >= minX && point.xU <= maxX && point.yU >= minY && point.yU <= maxY;
}

// Positive-area intersection with the visible key rectangle selects it in either workspace.
export function isKeyCellInMarquee(key: Position, marquee: Marquee): boolean {
  const minX = Math.min(marquee.start.xU, marquee.end.xU);
  const maxX = Math.max(marquee.start.xU, marquee.end.xU);
  const minY = Math.min(marquee.start.yU, marquee.end.yU);
  const maxY = Math.max(marquee.start.yU, marquee.end.yU);
  return doPolygonsOverlap({
    first: getKeyCorners({ ...key, id: '' }),
    second: [
      { xU: minX, yU: minY },
      { xU: maxX, yU: minY },
      { xU: maxX, yU: maxY },
      { xU: minX, yU: maxY },
    ],
  });
}
