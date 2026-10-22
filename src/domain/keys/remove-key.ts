import { getEncoderGeometry } from '@domain/geometry';
import { removeOrphanWires } from '@domain/wires';
import { getKeyPinPosition, getWirePinContacts } from '@domain/wires/geometry';
import { pruneInsulatedCrossings } from '@domain/crossings';
import type { Key, Project, WireEnd, Wire } from '@domain';

function freeKeyPin(end: WireEnd, key: Key): WireEnd {
  return end.kind === 'key-pin' && end.keyId === key.id
    ? { kind: 'free', at: getKeyPinPosition(key, end.pin) }
    : end;
}

export function removeKey(project: Project, input: { readonly keyId: string }): Project {
  const key = project.keys.find((candidate) => candidate.id === input.keyId);
  if (key === undefined) {
    return project;
  }
  const wires = project.wires.map((wire) => withoutKeyContacts(project, wire, key));
  const orphanIds = wires
    .filter(
      (wire) =>
        wire.start.kind !== 'key-pin' &&
        wire.end.kind !== 'key-pin' &&
        wire.start.kind !== 'encoder-pin' &&
        wire.end.kind !== 'encoder-pin' &&
        getWirePinContacts(project, wire).length === 0,
    )
    .map((wire) => wire.id);
  const withoutKey = {
    ...project,
    ...(project.wireContacts === undefined
      ? {}
      : {
          wireContacts: project.wireContacts.map((contact) =>
            contact !== false && contact.keyId === key.id ? false : contact,
          ),
        }),
    encoders: unlinkEncoders(project, key),
    keys: project.keys.filter((candidate) => candidate.id !== input.keyId),
    wires,
    layers: project.layers.map((layer) => ({
      ...layer,
      bindings: Object.fromEntries(
        Object.entries(layer.bindings).filter(([keyId]) => keyId !== input.keyId),
      ),
    })),
  };
  return pruneInsulatedCrossings(removeOrphanWires(withoutKey, { removedWireIds: orphanIds }));
}

function withoutKeyContacts(project: Project, wire: Wire, key: Key): Wire {
  return {
    ...wire,
    ...(wire.contacts === undefined
      ? {}
      : { contacts: wire.contacts.filter((contact) => contact.keyId !== key.id) }),
    ...(wire.contactIds === undefined
      ? {}
      : {
          contactIds: wire.contactIds.filter((id) =>
            getWirePinContacts(project, { ...wire, contacts: [], contactIds: [id] }).every(
              (contact) => contact.keyId !== key.id,
            ),
          ),
        }),
    start: freeKeyPin(wire.start, key),
    end: freeKeyPin(wire.end, key),
  };
}

function unlinkEncoders(project: Project, key: Key) {
  return project.encoders.map((encoder) => {
    if (encoder.pushKeyId !== key.id) {
      return encoder;
    }
    const { pushKeyId: _removed, ...rest } = encoder;
    return { ...rest, ...getEncoderGeometry(project, encoder) };
  });
}
