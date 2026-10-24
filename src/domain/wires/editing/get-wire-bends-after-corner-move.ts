import type { Project, Wire, WirePoint } from '@domain';
import { getWirePath } from '@domain/wires/geometry';

export function getWireBendsAfterCornerMove(
  project: Project,
  input: { readonly wire: Wire; readonly bendIndex: number; readonly point: WirePoint },
): readonly WirePoint[] {
  const { wire, bendIndex, point } = input;
  const origin = wire.bends[bendIndex];
  const path = getEditablePath(project, wire);
  const cornerIndex = path.findIndex((entry) => isSamePoint(entry, origin));
  const previous = path[cornerIndex - 1];
  const next = path[cornerIndex + 1];
  if (origin === undefined || previous === undefined || next === undefined) {
    return wire.bends.with(bendIndex, point);
  }
  const incomingIsVertical = previous.xU === origin.xU;
  const outgoingIsVertical = next.xU === origin.xU;
  const moved = path.with(cornerIndex, point);
  const before = incomingIsVertical
    ? { xU: point.xU, yU: previous.yU }
    : { xU: previous.xU, yU: point.yU };
  const after = outgoingIsVertical ? { xU: point.xU, yU: next.yU } : { xU: next.xU, yU: point.yU };
  if (cornerIndex > 1) {
    moved[cornerIndex - 1] = before;
  } else {
    moved.splice(cornerIndex, 0, before);
  }
  const movedIndex = moved.indexOf(point);
  if (cornerIndex < path.length - 2) {
    moved[movedIndex + 1] = after;
  } else {
    moved.splice(movedIndex + 1, 0, after);
  }
  // Horizontal-to-vertical elbows are already inserted by the horizontal-first router.
  const simplified = simplifyPath(moved);
  return simplified.slice(1, -1).filter((corner, index) => {
    const previousPoint = simplified[index];
    const nextPoint = simplified[index + 2];
    return previousPoint?.xU === corner.xU && nextPoint?.yU === corner.yU;
  });
}

function getEditablePath(project: Project, wire: Wire): readonly WirePoint[] {
  const path = getWirePath(project, wire);
  if (wire.anchors === undefined) {
    return simplifyPath(path);
  }
  const startIndex = path.findIndex((point) => isSamePoint(point, wire.anchors?.start));
  const endIndex = path.findLastIndex((point) => isSamePoint(point, wire.anchors?.end));
  return simplifyPath(path.slice(startIndex, endIndex + 1));
}

function simplifyPath(path: readonly WirePoint[]): WirePoint[] {
  const result: WirePoint[] = [];
  for (const point of path) {
    if (isSamePoint(result.at(-1), point)) {
      continue;
    }
    while (result.length > 1 && isCollinear(result.at(-2), result.at(-1), point)) {
      result.pop();
    }
    result.push(point);
  }
  return result;
}

function isCollinear(
  first: WirePoint | undefined,
  second: WirePoint | undefined,
  third: WirePoint,
) {
  return (
    first !== undefined &&
    second !== undefined &&
    ((first.xU === second.xU && second.xU === third.xU) ||
      (first.yU === second.yU && second.yU === third.yU))
  );
}

function isSamePoint(first: WirePoint | undefined, second: WirePoint | undefined): boolean {
  return (
    first !== undefined && second !== undefined && first.xU === second.xU && first.yU === second.yU
  );
}
