import { findWireContacts } from '@domain/wires';
import type { WireCrossing } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getProjectResourceError } from '@domain/project';
import type { Project } from '@domain';

/** New incidental crossings must not silently change the electrical configuration during a move. */
export function preserveKeyWiring(before: Project, candidate: Project): Project {
  // Match a displaced crossing by its wire pair/arc ordinal after preferring a fixed point.
  // The final partition check still rejects lost connections and newly merged overlaps.
  const oldContacts = findWireContacts(before);
  const newContacts = findWireContacts(candidate);
  const insulatedCrossings = newContacts.crossings
    .filter((crossing) => {
      const previous = findPreviousCrossing(oldContacts.crossings, crossing);
      return (
        previous === undefined ||
        before.insulatedCrossings.some(
          (entry) =>
            entry.wireIds[0] === crossing.wireIds[0] &&
            entry.wireIds[1] === crossing.wireIds[1] &&
            entry.ordinal === previous.ordinal,
        )
      );
    })
    .map(({ wireIds, ordinal }) => ({ wireIds, ordinal }));
  const next = { ...candidate, insulatedCrossings };
  if (getProjectResourceError(next) !== undefined) {
    return before;
  }
  return partitions(before) === partitions(next) ? next : before;
}

function partitions(project: Project): string {
  return JSON.stringify(
    getNets(project)
      .map((net) =>
        [
          ...(net.encoderPins ?? []).map((pin) => `encoder:${pin.encoderId}:${pin.pin}`),
          ...net.pins.map((pin) => `pin:${pin.keyId}:${pin.pin}`),
          ...net.terminalIds.map((id) => `terminal:${id}`),
          ...net.boardPins.map((pin) => `board:${pin.wireId}:${pin.side}:${pin.boardPin}`),
        ].toSorted(),
      )
      .filter((net) => net.length > 0)
      .map((net) => net.join('|'))
      .toSorted(),
  );
}

function findPreviousCrossing(crossings: readonly WireCrossing[], crossing: WireCrossing) {
  const peers = crossings.filter(
    (entry) => entry.wireIds[0] === crossing.wireIds[0] && entry.wireIds[1] === crossing.wireIds[1],
  );
  return (
    peers.find(
      (entry) =>
        Math.abs(entry.at.xU - crossing.at.xU) < 0.00001 &&
        Math.abs(entry.at.yU - crossing.at.yU) < 0.00001,
    ) ?? peers.find((entry) => entry.ordinal === crossing.ordinal)
  );
}
