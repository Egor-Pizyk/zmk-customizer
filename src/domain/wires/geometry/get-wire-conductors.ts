import { getWirePinContacts } from './get-wire-pin-contacts';
import type { Project, Wire, WirePoint } from '@domain';
import { getKeyPinPosition } from './get-key-pin-position';
import { getWirePath } from './get-wire-path';

/** The visible spine and each intermediate pin lead use the same geometry everywhere. */
export function getWireConductors(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
  wire: Wire,
): readonly (readonly WirePoint[])[] {
  const keys = new Map(project.keys.map((key) => [key.id, key]));
  const leads = getWirePinContacts(project, wire).flatMap((contact) => {
    const key = keys.get(contact.keyId);
    if (key === undefined) {
      return [];
    }
    const pin = getKeyPinPosition(key, contact.pin);
    if (pin.xU === contact.at.xU && pin.yU === contact.at.yU) {
      return [];
    }
    const bend = { xU: pin.xU, yU: contact.at.yU };
    return [[contact.at, bend, pin]];
  });
  return [getWirePath(project, wire), ...leads];
}
