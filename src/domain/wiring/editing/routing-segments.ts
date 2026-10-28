import { getWireConductors, getWireHalf, getKeyPinPosition } from '@domain/wires/geometry';
import { getNets } from '@domain/wires/nets';
import type { Project } from '@domain';
import type { RoutingSegment } from './symmetric-route-types';
import type { MatrixBusRoute } from './matrix-bus-types';

export function getRoutingSegments(project: Project): readonly RoutingSegment[] {
  const nets = getNets(project);
  return project.wires.flatMap((wire) => {
    const net = nets.find((entry) => entry.wireIds.includes(wire.id));
    const netId =
      net?.terminalIds.length === 1 ? (net.terminalIds[0] ?? wire.id) : `wire:${wire.id}`;
    return getWireConductors(project, wire).flatMap((path, pathIndex) =>
      path.slice(1).map((to, index) => ({
        id: `${wire.id}:${pathIndex}:${index}`,
        half: getWireHalf(project, wire),
        netId,
        from: path[index] ?? to,
        to,
      })),
    );
  });
}

export function getForeignPins(project: Project, route: MatrixBusRoute) {
  const allowed = new Set(route.branches.map((branch) => `${branch.keyId}:${branch.pin}`));
  return project.keys
    .filter((key) => (key.half ?? 'left') === route.half)
    .flatMap((key) =>
      ([1, 2] as const)
        .filter((pin) => !allowed.has(`${key.id}:${pin}`))
        .map((pin) => getKeyPinPosition(key, pin)),
    );
}
