import { isSameCrossing } from './is-same-crossing';
import type { CrossingRef, Project } from '@domain';

export function toggleCrossingInsulation(
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
