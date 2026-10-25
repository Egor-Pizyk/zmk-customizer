import { getNearestPointOnPath } from '@domain/geometry';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, WirePoint } from '@domain';

export function getWireBendsAfterInsertion(
  project: Project,
  input: { readonly wireId: string; readonly point: WirePoint },
): readonly WirePoint[] | undefined {
  const wire = project.wires.find((candidate) => candidate.id === input.wireId);
  if (wire === undefined) {
    return undefined;
  }
  const path = getWirePath(project, wire);
  // Pointer coordinates may be rounded off the conductor; insertion must preserve its path.
  const point = getNearestPointOnPath(path, input.point);
  if (point === undefined) {
    return undefined;
  }
  const segmentIndex = findClosestSegmentIndex(path, point);
  if (wire.bends.some((bend) => isSamePoint(bend, point))) {
    return wire.bends;
  }
  const insertIndex = wire.bends.filter(
    (bend) => findPointIndex(path, bend) <= segmentIndex,
  ).length;
  return wire.bends.toSpliced(insertIndex, 0, point);
}

function findPointIndex(path: readonly WirePoint[], point: WirePoint): number {
  return path.findIndex((candidate) => isSamePoint(candidate, point));
}

function isSamePoint(first: WirePoint, second: WirePoint): boolean {
  return first.xU === second.xU && first.yU === second.yU;
}

function findClosestSegmentIndex(path: readonly WirePoint[], point: WirePoint): number {
  let closest = { index: 0, distance: Number.POSITIVE_INFINITY };
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    if (from === undefined || to === undefined) {
      continue;
    }
    const xU = Math.max(Math.min(point.xU, Math.max(from.xU, to.xU)), Math.min(from.xU, to.xU));
    const yU = Math.max(Math.min(point.yU, Math.max(from.yU, to.yU)), Math.min(from.yU, to.yU));
    const distance = Math.hypot(point.xU - xU, point.yU - yU);
    if (distance < closest.distance) {
      closest = { index, distance };
    }
  }
  return closest.index;
}
