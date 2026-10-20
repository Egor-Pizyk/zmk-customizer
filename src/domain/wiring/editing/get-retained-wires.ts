import { getNets } from '@domain/wires/nets';
import type { Project, Wire } from '@domain';

export function getRetainedWires(project: Project): readonly Wire[] {
  const replaced = new Set(
    getNets(project)
      .filter((net) => net.pins.length > 0 || net.terminalIds.length > 0)
      .flatMap((net) => net.wireIds),
  );
  return project.wires.filter((wire) => !replaced.has(wire.id));
}
