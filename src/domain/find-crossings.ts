import { findWireContacts } from './find-wire-contacts';
import { isSameCrossing } from './is-same-crossing';
import type { CrossingRef, Project, WirePoint } from './types';

export type Crossing = {
  readonly ref: CrossingRef;
  readonly at: WirePoint;
  readonly isInsulated: boolean;
};

// Connected by default; only stored refs are insulated (003 clarification, R6).
export function findCrossings(project: Project): readonly Crossing[] {
  return findWireContacts(project).crossings.map(({ wireIds, ordinal, at }) => {
    const ref = { wireIds, ordinal };
    const isInsulated = project.insulatedCrossings.some((stored) => isSameCrossing(stored, ref));
    return { ref, at, isInsulated };
  });
}
