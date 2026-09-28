import { getKeyPinPosition } from './get-key-pin-position';
import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import { removeOrphanWires } from './remove-orphan-wires';
import type { Key, Project, WireEnd } from './types';

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
  const wires = project.wires.map((wire) => ({
    ...wire,
    start: freeKeyPin(wire.start, key),
    end: freeKeyPin(wire.end, key),
  }));
  const orphanIds = wires
    .filter((wire) => wire.start.kind !== 'key-pin' && wire.end.kind !== 'key-pin')
    .map((wire) => wire.id);
  const withoutKey = {
    ...project,
    keys: project.keys.filter((candidate) => candidate.id !== input.keyId),
    wires,
  };
  return pruneInsulatedCrossings(removeOrphanWires(withoutKey, { removedWireIds: orphanIds }));
}
