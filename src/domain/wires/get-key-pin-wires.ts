import { getWirePinContacts } from '@domain/wires/geometry';
import type { KeyPin, Project } from '@domain';

export function getKeyPinWires(
  project: Project,
): (input: { readonly keyId: string; readonly pin: KeyPin }) => readonly number[] {
  const wiresByPin = new Map<string, number[]>();
  const keys = new Set(project.keys.map((key) => key.id));
  for (const [wireIndex, wire] of project.wires.entries()) {
    const pins = new Set(
      [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((end) =>
        'keyId' in end && keys.has(end.keyId) ? [`${end.keyId}:${end.pin}`] : [],
      ),
    );
    for (const pin of pins) {
      const indices = wiresByPin.get(pin) ?? [];
      indices.push(wireIndex);
      wiresByPin.set(pin, indices);
    }
  }
  return (input) => wiresByPin.get(`${input.keyId}:${input.pin}`) ?? [];
}
