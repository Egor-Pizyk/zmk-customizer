import { findWireContacts } from './find-wire-contacts';
import { isSameCrossing } from './is-same-crossing';
import type { Project } from './types';

// FR-017: insulation lives only while its two wires still cross there. Returns the same object
// when nothing is dropped, so callers can compare cheaply.
export function pruneInsulatedCrossings(project: Project): Project {
  if (project.insulatedCrossings.length === 0) {
    return project;
  }
  const { crossings } = findWireContacts(project);
  const kept = project.insulatedCrossings.filter((stored) =>
    crossings.some((crossing) => isSameCrossing(stored, crossing)),
  );
  return kept.length === project.insulatedCrossings.length
    ? project
    : { ...project, insulatedCrossings: kept };
}
