import type { Project, WirePoint } from '@domain';

export type WireBendHandle = {
  readonly wireId: string;
  readonly point: WirePoint;
  readonly bendIndex: number | undefined;
};

export function getWireBendHandles(
  project: Project,
  paths: ReadonlyMap<string, readonly WirePoint[]>,
): readonly WireBendHandle[] {
  const handles = new Map<string, WireBendHandle>();
  for (const wire of project.wires) {
    const points = [...getWireCorners(paths.get(wire.id) ?? []), ...wire.bends];
    for (const point of points) {
      const positionKey = `${point.xU}:${point.yU}`;
      if (handles.has(positionKey)) {
        continue;
      }
      const bendIndex = wire.bends.findIndex(
        (bend) => bend.xU === point.xU && bend.yU === point.yU,
      );
      handles.set(positionKey, {
        wireId: wire.id,
        point,
        bendIndex: bendIndex === -1 ? undefined : bendIndex,
      });
    }
  }
  return [...handles.values()];
}

function getWireCorners(path: readonly WirePoint[]): readonly WirePoint[] {
  return path.slice(1, -1).filter((point, index) => {
    const previous = path[index];
    const next = path[index + 2];
    if (previous === undefined || next === undefined) {
      return false;
    }
    return (previous.yU === point.yU) !== (next.yU === point.yU);
  });
}
