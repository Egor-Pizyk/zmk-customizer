import { findWireContactError } from '@domain/wires';
import { getProjectResourceError } from '@domain/project';
import type { Project, WirePoint } from '@domain';

export function getWireBendsResourceError(
  project: Project,
  input: { readonly wireId: string; readonly bends: readonly WirePoint[] },
): string | undefined {
  const candidate = {
    ...project,
    wires: project.wires.map((wire) =>
      wire.id === input.wireId ? { ...wire, bends: input.bends } : wire,
    ),
  };
  return (
    candidate.wires
      .map((wire) => findWireContactError(candidate, wire))
      .find((error) => error !== undefined) ?? getProjectResourceError(candidate)
  );
}
