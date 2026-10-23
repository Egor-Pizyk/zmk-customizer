import { getWirePath } from '@domain/wires/geometry';
import {
  getWireBendsAfterInsertion,
  getWireBendsResourceError,
  setWireBends,
} from '@domain/wires/editing';
import type { Project, WirePoint } from '@domain';
import type { Drag, PointerState } from './pointer-types';

type BendDrag = Extract<Drag, { readonly kind: 'bend' }>;

export function getBendDragBends(project: Project, drag: BendDrag): readonly WirePoint[] {
  const wire = project.wires.find((candidate) => candidate.id === drag.wireId);
  if (wire === undefined) {
    return [];
  }
  const withoutDraggedBend = wire.bends.toSpliced(drag.bendIndex, 1);
  const pathWithoutDraggedBend = getWirePath(project, { ...wire, bends: withoutDraggedBend });
  return isPointOnPath(drag.point, pathWithoutDraggedBend, drag.collapseToleranceU)
    ? withoutDraggedBend
    : wire.bends.with(drag.bendIndex, drag.point);
}

export function insertBendAt(
  state: PointerState,
  input: { readonly wireId: string; readonly point: WirePoint },
) {
  const bends = getWireBendsAfterInsertion(state.project, input);
  if (bends === undefined) {
    return;
  }
  const resourceError = getWireBendsResourceError(state.project, { wireId: input.wireId, bends });
  if (resourceError !== undefined) {
    state.onHint(resourceError);
    return;
  }
  state.onSelectionChange({ kind: 'wire', wireId: input.wireId });
  state.commit((current) => setWireBends(current, { wireId: input.wireId, bends }));
}

function isPointOnPath(point: WirePoint, path: readonly WirePoint[], toleranceU: number): boolean {
  return path.slice(1).some((to, index) => {
    const from = path[index];
    return from !== undefined && isPointOnSegment({ point, from, to, toleranceU });
  });
}

function isPointOnSegment(input: {
  readonly point: WirePoint;
  readonly from: WirePoint;
  readonly to: WirePoint;
  readonly toleranceU: number;
}): boolean {
  const { point, from, to, toleranceU } = input;
  const withinX =
    point.xU >= Math.min(from.xU, to.xU) - toleranceU &&
    point.xU <= Math.max(from.xU, to.xU) + toleranceU;
  const withinY =
    point.yU >= Math.min(from.yU, to.yU) - toleranceU &&
    point.yU <= Math.max(from.yU, to.yU) + toleranceU;
  const isCollinear =
    (from.xU === to.xU && Math.abs(point.xU - from.xU) <= toleranceU) ||
    (from.yU === to.yU && Math.abs(point.yU - from.yU) <= toleranceU);
  return isCollinear && withinX && withinY;
}
