import type { Wire, WireContact } from '@domain';

/** Share coordinates, retaining each wire's independent attachment provenance. */
export function shareWireContacts(wires: readonly Wire[]) {
  const wireContacts: WireContact[] = [];
  const ids = new Map<string, number>();
  const shared = wires.map((wire) => {
    if (wire.contacts === undefined) {
      return wire;
    }
    const contactIds = wire.contacts.map((contact) => {
      const identity = JSON.stringify(contact);
      const previous = ids.get(identity);
      if (previous !== undefined) {
        return previous;
      }
      const id = wireContacts.length;
      wireContacts.push(contact);
      ids.set(identity, id);
      return id;
    });
    return { ...wire, contacts: [], contactIds };
  });
  return wireContacts.length === 0 ? { wires } : { wires: shared, wireContacts };
}
