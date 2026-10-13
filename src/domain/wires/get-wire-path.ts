import { getKeyPinPosition } from './get-key-pin-position';
import { assertNever } from '../assert-never';
import { getNearestPointOnPath } from '../geometry/get-nearest-point-on-path';
import type { Project, Wire, WireEnd, WirePoint } from '../types';

function isSamePoint(first: WirePoint, second: WirePoint): boolean {
  return first.xU === second.xU && first.yU === second.yU;
}

// Horizontal first, so a wire leaving a pin runs along the row before turning (003 R4).
function toOrthogonal(points: readonly WirePoint[]): WirePoint[] {
  const path: WirePoint[] = [];
  for (const point of points) {
    const previous = path.at(-1);
    if (previous !== undefined && isSamePoint(previous, point)) {
      continue;
    }
    if (previous !== undefined && previous.xU !== point.xU && previous.yU !== point.yU) {
      path.push({ xU: point.xU, yU: previous.yU });
    }
    path.push(point);
  }
  return path;
}

function getRoughEndPoint(project: Project, end: WireEnd): WirePoint {
  return end.kind === 'junction' ? end.at : getEndPoint(project, end);
}

function getRoughPath(project: Project, wire: Wire): WirePoint[] {
  const start = getRoughEndPoint(project, wire.start);
  const end = getRoughEndPoint(project, wire.end);
  return toOrthogonal([start, ...wire.bends, end]);
}

function getEndPoint(project: Project, end: WireEnd): WirePoint {
  switch (end.kind) {
    case 'key-pin': {
      const key = project.keys.find((candidate) => candidate.id === end.keyId);
      if (key === undefined) {
        throw new Error(`Wire end references missing key ${end.keyId}`);
      }
      return getKeyPinPosition(key, end.pin);
    }
    case 'junction': {
      const target = project.wires.find((candidate) => candidate.id === end.wireId);
      // ponytail: one level only; the target's own junction ends use their stored point, which
      // also keeps two wires that join each other from recursing forever.
      const targetPath = target === undefined ? [] : getRoughPath(project, target);
      return getNearestPointOnPath(targetPath, end.at) ?? end.at;
    }
    case 'free': {
      return end.at;
    }
    default: {
      return assertNever(end);
    }
  }
}

export function getWirePath(project: Project, wire: Wire): readonly WirePoint[] {
  const start = getEndPoint(project, wire.start);
  const end = getEndPoint(project, wire.end);
  return toOrthogonal([start, ...wire.bends, end]);
}
