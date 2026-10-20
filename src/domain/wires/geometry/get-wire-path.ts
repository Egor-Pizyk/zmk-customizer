import { getWirePinContacts } from './get-wire-pin-contacts';
import { getKeyPinPosition } from './get-key-pin-position';
import { assertNever } from '@domain';
import type { Project, Wire, WireEnd, WirePoint } from '@domain';
import { getNearestPointOnPath } from '@domain/geometry';

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

function getRoughEndPoint(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  end: WireEnd,
): WirePoint {
  return end.kind === 'junction' ? end.at : getEndPoint(project, end);
}

function getRoughPath(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  wire: Wire,
): WirePoint[] {
  const start = getRoughEndPoint(project, wire.start);
  const end = getRoughEndPoint(project, wire.end);
  return toOrthogonal([
    start,
    ...(wire.anchors === undefined ? [] : [wire.anchors.start]),
    ...wire.bends,
    ...(wire.anchors === undefined ? [] : [wire.anchors.end]),
    end,
  ]);
}

function getEndPoint(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  end: WireEnd,
): WirePoint {
  switch (end.kind) {
    case 'key-pin': {
      const key = project.keys.find((candidate) => candidate.id === end.keyId);
      if (key === undefined) {
        throw new Error(`Wire end references missing key ${end.keyId}`);
      }
      return getKeyPinPosition(key, end.pin);
    }
    case 'junction': {
      return getJunctionPoint(project, end);
    }
    case 'free': {
      return end.at;
    }
    default: {
      return assertNever(end);
    }
  }
}

export function getWirePath(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  wire: Wire,
): readonly WirePoint[] {
  const start = getEndPoint(project, wire.start);
  const end = getEndPoint(project, wire.end);
  return toOrthogonal([
    start,
    ...(wire.anchors === undefined ? [] : [wire.anchors.start]),
    ...wire.bends,
    ...(wire.anchors === undefined ? [] : [wire.anchors.end]),
    end,
  ]);
}

function getJunctionPoint(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  end: Extract<WireEnd, { readonly kind: 'junction' }>,
): WirePoint {
  const target = project.wires.find((candidate) => candidate.id === end.wireId);
  // ponytail: one level only; the target's own junction ends use their stored point, which
  // also keeps two wires that join each other from recursing forever.
  const targetPath = target === undefined ? [] : getRoughPath(project, target);
  const leadPaths = (target === undefined ? [] : getWirePinContacts(project, target)).flatMap(
    (contact) => {
      const key = project.keys.find((entry) => entry.id === contact.keyId);
      return key === undefined
        ? []
        : [toOrthogonal([contact.at, getKeyPinPosition(key, contact.pin)])];
    },
  );
  const nearest = [targetPath, ...leadPaths]
    .flatMap((path) => {
      const point = getNearestPointOnPath(path, end.at);
      return point === undefined ? [] : [point];
    })
    .toSorted(
      (one, other) =>
        Math.hypot(one.xU - end.at.xU, one.yU - end.at.yU) -
        Math.hypot(other.xU - end.at.xU, other.yU - end.at.yU),
    );
  return nearest[0] ?? end.at;
}
