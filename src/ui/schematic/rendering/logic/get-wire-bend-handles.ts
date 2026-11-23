import { getSelectedWireIds } from './get-selected-wire-ids';
import type { SchematicSelection } from '@ui/schematic/interaction';
import type { Project, WirePoint, Wire } from '@domain';

export type WireBendHandle = {
  readonly wireId: string;
  readonly point: WirePoint;
  readonly bendIndex: number | undefined;
};

export function getWireBendHandles(
  project: Project,
  paths: ReadonlyMap<string, readonly WirePoint[]>,
  selection?: SchematicSelection,
): readonly WireBendHandle[] {
  const handles = new Map<string, WireBendHandle>();
  const selected =
    project.wiring?.kind === 'direct' ? getSelectedWireIds(project, selection) : undefined;
  for (const wire of project.wires) {
    if (selected !== undefined && !selected.has(wire.id)) {
      continue;
    }
    const corners = getWireCorners(paths.get(wire.id) ?? []);
    const points = getHandlePoints(wire, corners, selection);
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

function getHandlePoints(wire: Wire, corners: readonly WirePoint[], selection: SchematicSelection) {
  const active =
    selection?.kind === 'wire' && selection.wireId === wire.id
      ? wire.bends.find(
          (point) => point.xU === selection.activeBend?.xU && point.yU === selection.activeBend.yU,
        )
      : undefined;
  if (active !== undefined) {
    return [...corners, active];
  }
  return corners.length > 0 ? corners : wire.bends.slice(0, 1);
}
