import { getNearestPointOnPath } from './get-nearest-point-on-path';
import { getWirePath } from './get-wire-path';
import type { Project, Wire, WireEnd } from './types';

function hasKeyPin(wire: Wire): boolean {
  return wire.start.kind === 'key-pin' || wire.end.kind === 'key-pin';
}

function freeJunction(project: Project, end: WireEnd, removedIds: ReadonlySet<string>): WireEnd {
  if (end.kind !== 'junction' || !removedIds.has(end.wireId)) {
    return end;
  }
  const target = project.wires.find((wire) => wire.id === end.wireId);
  const path = target === undefined ? [] : getWirePath(project, target);
  return { kind: 'free', at: getNearestPointOnPath(path, end.at) ?? end.at };
}

function removeOnce(project: Project, removedIds: ReadonlySet<string>): Project {
  const wires: Wire[] = [];
  for (const wire of project.wires) {
    if (!removedIds.has(wire.id)) {
      const start = freeJunction(project, wire.start, removedIds);
      const end = freeJunction(project, wire.end, removedIds);
      wires.push({ id: wire.id, start, end, bends: wire.bends });
    }
  }
  return { ...project, wires };
}

/**
 * Removes the given wires, turns junctions onto them into free ends at their drawn point, then
 * removes wires left without a key pin (FR-009, FR-012), repeating until stable.
 */
export function removeOrphanWires(
  project: Project,
  input: { readonly removedWireIds: readonly string[] },
): Project {
  let current = project;
  let removedIds: ReadonlySet<string> = new Set(input.removedWireIds);
  while (removedIds.size > 0) {
    current = removeOnce(current, removedIds);
    removedIds = new Set(current.wires.filter((wire) => !hasKeyPin(wire)).map((wire) => wire.id));
  }
  return current;
}
