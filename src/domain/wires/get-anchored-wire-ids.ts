import { getWirePinContacts } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';

/** Keep explicit conductor chains that still reach a real key/encoder pin. */
export function getAnchoredWireIds(project: Project): ReadonlySet<string> {
  return getRelatedWireIds(
    project,
    project.wires.filter((wire) => hasPin(project, wire)).map((wire) => wire.id),
  );
}

export function getRelatedWireIds(project: Project, ids: readonly string[]): ReadonlySet<string> {
  const adjacent = wireAdjacency(project);
  const pending = [...ids];
  const anchored = new Set(pending);
  for (const id of pending) {
    for (const neighbor of adjacent.get(id) ?? []) {
      if (!anchored.has(neighbor)) {
        anchored.add(neighbor);
        pending.push(neighbor);
      }
    }
  }
  return anchored;
}
function hasPin(project: Project, wire: Wire): boolean {
  return (
    wire.start.kind === 'key-pin' ||
    wire.end.kind === 'key-pin' ||
    wire.start.kind === 'encoder-pin' ||
    wire.end.kind === 'encoder-pin' ||
    getWirePinContacts(project, wire).length > 0
  );
}
function wireAdjacency(project: Project): ReadonlyMap<string, ReadonlySet<string>> {
  const adjacent = new Map(project.wires.map((wire) => [wire.id, new Set<string>()]));
  for (const wire of project.wires) {
    for (const end of [wire.start, wire.end]) {
      if (end.kind === 'junction' && adjacent.has(end.wireId)) {
        adjacent.get(wire.id)?.add(end.wireId);
        adjacent.get(end.wireId)?.add(wire.id);
      }
    }
  }
  return adjacent;
}
