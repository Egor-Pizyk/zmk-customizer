import { isSameCrossing } from '@domain/crossings';
import type { Project, WirePoint } from '@domain';
import type { WireContacts } from '@domain/wires/contacts';
import type { RelationPath, RelationLocation } from './electrical-relation-types';
import { compareText, locate } from './relation-path-geometry';

type LocatedCrossing = {
  readonly pair: string;
  readonly at: WirePoint;
  readonly first: RelationLocation;
  readonly second: RelationLocation;
};

export function addConnectedCrossings(
  project: Project,
  paths: readonly RelationPath[],
  contacts: WireContacts,
) {
  const crossings = contacts.crossings
    .filter((crossing) => !project.insulatedCrossings.some((ref) => isSameCrossing(ref, crossing)))
    .flatMap((crossing) => {
      const ids = crossing.wireIds.toSorted(compareText);
      const first = locate(paths, { wireId: ids[0] ?? '', at: crossing.at });
      const second = locate(paths, { wireId: ids[1] ?? '', at: crossing.at });
      return first === undefined || second === undefined
        ? []
        : [{ pair: `${ids[0]}:${ids[1]}`, first, second, at: crossing.at }];
    })
    .toSorted(compareCrossings);
  const count = new Map<string, number>();
  for (const crossing of crossings) {
    const ordinal = count.get(crossing.pair) ?? 0;
    count.set(crossing.pair, ordinal + 1);
    const label = `cross:${crossing.pair}:${ordinal}`;
    crossing.first.path.sites.push({ arc: crossing.first.arc, label, at: crossing.at });
    crossing.second.path.sites.push({ arc: crossing.second.arc, label, at: crossing.at });
  }
}

function compareCrossings(first: LocatedCrossing, second: LocatedCrossing): number {
  return (
    compareText(first.pair, second.pair) ||
    first.first.path.order - second.first.path.order ||
    first.first.arc - second.first.arc ||
    first.second.path.order - second.second.path.order ||
    first.second.arc - second.second.arc
  );
}
