import { findWireContacts } from '@domain/wires/contacts';
import { isSameCrossing } from '@domain/crossings';
import type { Project } from '@domain';

export function preservePrettifyInsulation(base: Project, candidate: Project): Project {
  const connected = findWireContacts(base).crossings.filter(
    (crossing) => !base.insulatedCrossings.some((ref) => isSameCrossing(ref, crossing)),
  );
  const insulatedCrossings = findWireContacts(candidate)
    .crossings.filter(
      (crossing) =>
        !connected.some(
          (contact) =>
            contact.wireIds[0] === crossing.wireIds[0] &&
            contact.wireIds[1] === crossing.wireIds[1] &&
            contact.at.xU === crossing.at.xU &&
            contact.at.yU === crossing.at.yU,
        ),
    )
    .map(({ wireIds, ordinal }) => ({ wireIds, ordinal }));
  return { ...candidate, insulatedCrossings };
}
