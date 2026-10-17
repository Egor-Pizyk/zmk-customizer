import { getProjectResourceError } from '@domain/project';
import type { Project, WirePoint } from '@domain';

export function getWireBendsResourceError(
  project: Project,
  input: { readonly wireId: string; readonly bends: readonly WirePoint[] },
): string | undefined {
  return getProjectResourceError({
    ...project,
    wires: project.wires.map((wire) =>
      wire.id === input.wireId ? { ...wire, bends: input.bends } : wire,
    ),
  });
}
