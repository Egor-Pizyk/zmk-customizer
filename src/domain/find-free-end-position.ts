import { getWirePath } from './get-wire-path';
import type { Project, WirePoint } from './types';

const STEP_U = 1;
const SNAP_U = 0.25;

function snap(valueU: number): number {
  return Math.round(valueU / SNAP_U) * SNAP_U;
}

function isOccupied(project: Project, point: WirePoint): boolean {
  return project.wires.some((wire) => {
    const path = getWirePath(project, wire);
    return [path[0], path.at(-1)].some((end) => end?.xU === point.xU && end.yU === point.yU);
  });
}

// Keyboard "Add wire" with a free end: 1u below the start, stepping down while taken (003 U3).
export function findFreeEndPosition(
  project: Project,
  input: { readonly start: WirePoint },
): WirePoint {
  let point = { xU: snap(input.start.xU), yU: snap(input.start.yU + STEP_U) };
  while (isOccupied(project, point)) {
    point = { xU: point.xU, yU: point.yU + STEP_U };
  }
  return point;
}
