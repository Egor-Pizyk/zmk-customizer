import { getAnchoredWireIds, getRelatedWireIds } from './get-anchored-wire-ids';
import { preserveWireProtection } from '@domain/wires/protection';
import { getNearestPointOnPath } from '@domain/geometry';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, Wire, WireEnd } from '@domain';

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
      wires.push({ ...wire, start, end });
    }
  }
  return { ...project, wires };
}

/**
 * Removes the given wires, turns junctions onto them into free ends at their drawn point, then
 * removes affected conductor chains left without a real pin. Unrelated repairable
 * fragments remain intact (003 FR-012 as extended by 033/040).
 */
function removeOrphanWiresCandidate(
  project: Project,
  input: { readonly removedWireIds: readonly string[] },
): Project {
  let current = project;
  const affected = getRelatedWireIds(project, input.removedWireIds);
  let removedIds: ReadonlySet<string> = new Set(input.removedWireIds);
  while (removedIds.size > 0) {
    current = removeOnce(current, removedIds);
    const anchored = getAnchoredWireIds(current);
    removedIds = new Set(
      current.wires
        .filter((wire) => affected.has(wire.id) && !anchored.has(wire.id))
        .map((wire) => wire.id),
    );
  }
  return current;
}

export function removeOrphanWires(
  project: Project,
  input: Parameters<typeof removeOrphanWiresCandidate>[1],
): Project {
  return preserveWireProtection(project, removeOrphanWiresCandidate(project, input));
}
