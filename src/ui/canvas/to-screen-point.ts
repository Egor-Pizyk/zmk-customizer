import type { WorldPoint } from './viewport';
import type { ContentView } from './surface-content';

export function toScreenPoint(view: ContentView, point: WorldPoint): { xPx: number; yPx: number } {
  return { xPx: view.panXPx + point.xU * view.pxPerU, yPx: view.panYPx + point.yU * view.pxPerU };
}
