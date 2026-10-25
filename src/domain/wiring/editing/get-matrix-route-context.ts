import { getEncoderPinPosition } from '@domain/geometry';
import { getKeyPinPosition, getWireConductors } from '@domain/wires/geometry';
import { getNets } from '@domain/wires/nets';
import type { Project, WirePoint } from '@domain';
import type { RouteArea, RoutePin, RouteSegment } from './get-route-path-cost';

export function getMatrixRouteContext(project: Project) {
  const pins: RoutePin[] = project.keys.flatMap((key) =>
    ([1, 2] as const).map((pin) => ({
      id: `${key.id}:${pin}`,
      at: getKeyPinPosition(key, pin),
    })),
  );
  pins.push(
    ...project.encoders.flatMap((encoder) =>
      (['A', 'COM', 'B'] as const).map((pin) => ({
        id: `encoder:${encoder.id}:${pin}`,
        at: getEncoderPinPosition(project, encoder, pin),
      })),
    ),
  );
  const labels = new Map<string, string>();
  for (const [index, net] of getNets(project).entries()) {
    for (const id of net.wireIds) {
      labels.set(id, `retained:${index}`);
    }
  }
  const segments: RouteSegment[] = [];
  for (const wire of project.wires) {
    for (const path of getWireConductors(project, wire)) {
      segments.push(...getPathSegments(path, labels.get(wire.id) ?? wire.id));
    }
  }
  const areas: RouteArea[] = [];
  return { pins, segments, labels, areas };
}

function getPathSegments(path: readonly WirePoint[], net: string) {
  const segments: RouteSegment[] = [];
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    if (start !== undefined && end !== undefined) {
      segments.push({ start, end, net });
    }
  }
  return segments;
}
