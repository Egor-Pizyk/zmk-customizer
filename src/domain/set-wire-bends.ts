import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import type { Project, WirePoint } from './types';

export function setWireBends(
  project: Project,
  input: { readonly wireId: string; readonly bends: readonly WirePoint[] },
): Project {
  const wires = project.wires.map((wire) =>
    wire.id === input.wireId &&
    !(
      wire.bends.length === input.bends.length &&
      wire.bends.every(
        (point, index) => point.xU === input.bends[index]?.xU && point.yU === input.bends[index].yU,
      )
    )
      ? { ...wire, bends: input.bends }
      : wire,
  );
  return wires.every((wire, index) => wire === project.wires[index])
    ? project
    : pruneInsulatedCrossings({ ...project, wires });
}
