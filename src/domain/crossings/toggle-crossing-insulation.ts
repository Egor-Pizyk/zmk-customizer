import { preserveWireProtection } from '@domain/wires/protection';
import { isSameCrossing } from './is-same-crossing';
import type { CrossingRef, Project } from '@domain';

function toggleCrossingInsulationCandidate(
  project: Project,
  input: { readonly ref: CrossingRef },
): Project {
  const isInsulated = project.insulatedCrossings.some((stored) =>
    isSameCrossing(stored, input.ref),
  );
  const insulatedCrossings = isInsulated
    ? project.insulatedCrossings.filter((stored) => !isSameCrossing(stored, input.ref))
    : [...project.insulatedCrossings, { wireIds: input.ref.wireIds, ordinal: input.ref.ordinal }];
  return { ...project, insulatedCrossings };
}

export function toggleCrossingInsulation(
  project: Project,
  input: Parameters<typeof toggleCrossingInsulationCandidate>[1],
): Project {
  return preserveWireProtection(project, toggleCrossingInsulationCandidate(project, input));
}
