import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import type { Project, WirePoint } from './types';

export function setWireBends(
  project: Project,
  input: { readonly wireId: string; readonly bends: readonly WirePoint[] },
): Project {
  const wires = project.wires.map((wire) =>
    wire.id === input.wireId ? { ...wire, bends: input.bends } : wire,
  );
  return pruneInsulatedCrossings({ ...project, wires });
}
