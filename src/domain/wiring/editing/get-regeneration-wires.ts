import { getNets } from '@domain/wires/nets';
import { getWireProtection } from '@domain/wires/protection';
import type { Project, Wire } from '@domain';
import type { ResolvedWiringScope } from './resolve-wiring-scope';

export function getRegenerationWires(
  project: Project,
  scope: ResolvedWiringScope,
): readonly Wire[] {
  const relevant = new Set(
    getNets(project)
      .filter((net) => net.pins.some((pin) => scope.keyIds.includes(pin.keyId)))
      .flatMap((net) => net.wireIds),
  );
  const removed = new Set(scope.wireIds.filter((id) => relevant.has(id)));
  const protectedIds = getProtectedWireIds(project);
  const kept = new Set(
    project.wires
      .filter((wire) => !removed.has(wire.id) || protectedIds.has(wire.id))
      .map((wire) => wire.id),
  );
  const byId = new Map(project.wires.map((wire) => [wire.id, wire]));
  const pending = [...kept];
  for (const id of pending) {
    const wire = byId.get(id);
    if (wire === undefined) {
      continue;
    }
    for (const end of [wire.start, wire.end]) {
      if (end.kind === 'junction' && !kept.has(end.wireId)) {
        kept.add(end.wireId);
        pending.push(end.wireId);
      }
    }
  }
  return project.wires.filter((wire) => kept.has(wire.id));
}

function getProtectedWireIds(project: Project): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const protection of getWireProtection(project, { includeAttachments: true })) {
    ids.add(protection.wireId);
    for (const id of protection.attachedWireIds ?? []) {
      ids.add(id);
    }
  }
  return ids;
}
