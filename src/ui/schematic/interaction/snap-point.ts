import { roundU } from '@domain/geometry';
import type { WirePoint } from '@domain';
import { snapToGrid } from '@ui/canvas/logic';

/** `gridU` is the grid step while snapping is on, else undefined. */
export function snapPoint(point: WirePoint, gridU: number | undefined): WirePoint {
  return gridU === undefined
    ? { xU: roundU(point.xU), yU: roundU(point.yU) }
    : { xU: snapToGrid(point.xU, gridU), yU: snapToGrid(point.yU, gridU) };
}
