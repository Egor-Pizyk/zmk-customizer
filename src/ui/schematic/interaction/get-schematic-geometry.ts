import { getKeyPinPosition, getWirePath, roundU } from '@domain';
import type { Key, Project, WireEnd, WirePoint } from '@domain';

export type DiodePlacement = {
  readonly at: WirePoint;
  readonly terminal: WirePoint;
  readonly angle: number;
};

function outgoingDirection(path: readonly WirePoint[]) {
  const segments = path.slice(1).map((point, index) => {
    const previous = path[index] ?? point;
    return { dx: point.xU - previous.xU, dy: point.yU - previous.yU };
  });
  // A tiny automatic elbow should not point the body back across the outgoing wire.
  return (
    segments.find(({ dx, dy }) => Math.hypot(dx, dy) >= 0.32) ??
    segments.find(({ dx, dy }) => dx !== 0 || dy !== 0)
  );
}

function directionsAtPoint(path: readonly WirePoint[], at: WirePoint) {
  return path.slice(1).flatMap((to, index) => {
    const from = path[index] ?? to;
    const liesOnSegment =
      at.xU >= Math.min(from.xU, to.xU) - 0.0001 &&
      at.xU <= Math.max(from.xU, to.xU) + 0.0001 &&
      at.yU >= Math.min(from.yU, to.yU) - 0.0001 &&
      at.yU <= Math.max(from.yU, to.yU) + 0.0001;
    if (!liesOnSegment) {
      return [];
    }
    return [from, to]
      .map((point) => ({ dx: point.xU - at.xU, dy: point.yU - at.yU }))
      .filter(({ dx, dy }) => Math.hypot(dx, dy) >= 0.0001)
      .map(({ dx, dy }) => ({ dx: Math.sign(dx), dy: Math.sign(dy) }));
  });
}

function placeDiode(project: Project, key: Key): DiodePlacement | undefined {
  const diode = key.diode;
  if (diode === undefined) {
    return undefined;
  }
  const at = getKeyPinPosition(key, diode.pin);
  const directions: { readonly dx: number; readonly dy: number }[] = [];
  for (const wire of project.wires) {
    const isStart =
      wire.start.kind === 'key-pin' && wire.start.keyId === key.id && wire.start.pin === diode.pin;
    const isEnd =
      wire.end.kind === 'key-pin' && wire.end.keyId === key.id && wire.end.pin === diode.pin;
    const path = getWirePath(project, wire);
    if (!isStart && !isEnd) {
      directions.push(...directionsAtPoint(path, at));
      continue;
    }
    const direction = outgoingDirection(isStart ? path : path.toReversed());
    if (direction !== undefined) {
      directions.push({ dx: Math.sign(direction.dx), dy: Math.sign(direction.dy) });
    }
  }
  // Prefer a row's rightward continuation, not an earlier incoming branch.
  const { dx, dy } = directions.toSorted(
    (first, second) => directionRank(first) - directionRank(second),
  )[0] ?? { dx: 0, dy: -1 };
  return {
    at,
    terminal: { xU: roundU(at.xU + dx * 0.32), yU: roundU(at.yU + dy * 0.32) },
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

function directionRank(direction: { readonly dx: number; readonly dy: number }): number {
  if (direction.dx > 0) {
    return 0;
  }
  if (direction.dx < 0) {
    return 1;
  }
  return direction.dy > 0 ? 2 : 3;
}

function displayEnd(
  project: Project,
  end: WireEnd,
  diodes: ReadonlyMap<string, DiodePlacement>,
): WireEnd {
  if (end.kind !== 'key-pin') {
    return end;
  }
  const key = project.keys.find((candidate) => candidate.id === end.keyId);
  const placement = diodes.get(end.keyId);
  return key?.diode?.pin === end.pin && placement !== undefined
    ? { kind: 'free', at: placement.terminal }
    : end;
}

export function getSchematicGeometry(project: Project) {
  const diodes = new Map<string, DiodePlacement>();
  for (const key of project.keys) {
    const placement = placeDiode(project, key);
    if (placement !== undefined) {
      diodes.set(key.id, placement);
    }
  }
  // Only drawing uses these terminal coordinates; electrical paths keep the saved pin endpoints.
  const displayProject = {
    ...project,
    wires: project.wires.map((wire) => ({
      id: wire.id,
      bends: wire.bends,
      start: displayEnd(project, wire.start, diodes),
      end: displayEnd(project, wire.end, diodes),
    })),
  };
  return {
    diodes,
    paths: new Map(
      displayProject.wires.map((wire) => [wire.id, getWirePath(displayProject, wire)]),
    ),
  };
}
