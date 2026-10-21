import { captureWireContacts, findWireContactError } from '@domain/wires';
import { getProjectResourceError } from '@domain/project';
import { pruneInsulatedCrossings } from '@domain/crossings';
import type { Project, WirePoint } from '@domain';

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
      ? captureWireContacts(project, { ...wire, bends: input.bends })
      : wire,
  );
  const candidate = { ...project, wires };
  return wires.some((wire) => findWireContactError(candidate, wire) !== undefined) ||
    getProjectResourceError(candidate) !== undefined ||
    wires.every((wire, index) => wire === project.wires[index])
    ? project
    : pruneInsulatedCrossings({ ...project, wires });
}
