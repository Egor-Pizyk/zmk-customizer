import type { WirePoint } from '../../domain/types';
import type { Marquee } from './marquee-layer';

type Position = { readonly xU: number; readonly yU: number };

// A zero-size point (wire bend, free end) is inside when it lies within the rect.
export function isPointInMarquee(point: WirePoint, marquee: Marquee): boolean {
  const minX = Math.min(marquee.start.xU, marquee.end.xU);
  const maxX = Math.max(marquee.start.xU, marquee.end.xU);
  const minY = Math.min(marquee.start.yU, marquee.end.yU);
  const maxY = Math.max(marquee.start.yU, marquee.end.yU);
  return point.xU >= minX && point.xU <= maxX && point.yU >= minY && point.yU <= maxY;
}

// A key occupies a 1u cell from its top-left corner; any overlap selects it, so keys on
// the marquee border behave the same in Schematic and Bindings.
export function isKeyCellInMarquee(key: Position, marquee: Marquee): boolean {
  const minX = Math.min(marquee.start.xU, marquee.end.xU);
  const maxX = Math.max(marquee.start.xU, marquee.end.xU);
  const minY = Math.min(marquee.start.yU, marquee.end.yU);
  const maxY = Math.max(marquee.start.yU, marquee.end.yU);
  return key.xU < maxX && key.xU + 1 > minX && key.yU < maxY && key.yU + 1 > minY;
}
