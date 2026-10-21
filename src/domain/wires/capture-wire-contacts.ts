import type { Project, Wire } from '@domain';
import { getKeyPinPosition, getWirePath, getWirePinContacts } from '@domain/wires/geometry';

/** Capture only during a wiring action or a validated legacy migration, never a key move. */
export function captureWireContacts(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  wire: Wire,
): Wire {
  const path = getWirePath(project, wire);
  const contacts = [...(wire.contacts ?? [])];
  for (const key of project.keys) {
    for (const pin of [1, 2] as const) {
      const attached = [
        wire.start,
        wire.end,
        ...getWirePinContacts(project, wire),
        ...contacts,
      ].some((end) => 'keyId' in end && end.keyId === key.id && end.pin === pin);
      if (attached) {
        continue;
      }
      const at = getKeyPinPosition(key, pin);
      const onPath = path.some((from, index) => {
        const to = path[index + 1] ?? from;
        return (
          at.xU >= Math.min(from.xU, to.xU) - 0.0001 &&
          at.xU <= Math.max(from.xU, to.xU) + 0.0001 &&
          at.yU >= Math.min(from.yU, to.yU) - 0.0001 &&
          at.yU <= Math.max(from.yU, to.yU) + 0.0001
        );
      });
      if (onPath) {
        contacts.push({ keyId: key.id, pin, at });
      }
    }
  }
  const start = path[0];
  const end = path.at(-1);
  return contacts.length === 0 || start === undefined || end === undefined
    ? wire
    : { ...wire, contacts, anchors: wire.anchors ?? { start, end } };
}
