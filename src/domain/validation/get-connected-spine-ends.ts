import { getWirePath, getWirePinContacts } from '@domain/wires/geometry';
import type { Project, WirePoint } from '@domain';

/** Explicit attachments only: passing a pin or crossing another conductor is insufficient. */
export function getConnectedSpineEnds(project: Project): ReadonlyMap<string, readonly WirePoint[]> {
  const points = new Map<string, WirePoint[]>();
  const keys = new Set(project.keys.map((key) => key.id));
  for (const wire of project.wires) {
    for (const contact of getWirePinContacts(project, wire)) {
      if (keys.has(contact.keyId)) {
        append(points, { id: wire.id, at: contact.at });
      }
    }
    if (wire.start.kind !== 'junction' && wire.end.kind !== 'junction') {
      continue;
    }
    const path = getWirePath(project, wire);
    for (const side of ['start', 'end'] as const) {
      const end = wire[side];
      const at = side === 'start' ? path[0] : path.at(-1);
      if (end.kind === 'junction' && at !== undefined) {
        append(points, { id: end.wireId, at });
      }
    }
  }
  return points;
}

function append(
  points: Map<string, WirePoint[]>,
  input: { readonly id: string; readonly at: WirePoint },
) {
  const entries = points.get(input.id) ?? [];
  entries.push(input.at);
  points.set(input.id, entries);
}
