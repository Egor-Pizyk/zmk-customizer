import { findWireContacts } from '@domain/wires/contacts';
import { getWireHalf } from '@domain/wires/geometry';
import type { Project, WireEnd, WirePoint } from '@domain';
import { getNets } from './get-nets';
import type { Net } from './get-nets';
import type {
  ElectricalRelations,
  ElectricalRoutingPath,
  RelationPath,
  RelationSite,
} from './electrical-relation-types';
import { getRelationPaths } from './electrical-conductors';
import { addConnectedCrossings } from './relation-crossings';
import { addSharedSpans } from './relation-overlaps';
import { compareText, pointAtArc } from './relation-path-geometry';

/** Canonical electrical incidence and ordered branch sites; insulated geometry events are absent. */
export function getElectricalRelations(project: Project): ElectricalRelations {
  return getElectricalRelationAnalysis(project).relations;
}

export function getElectricalRelationAnalysis(project: Project): {
  readonly relations: ElectricalRelations;
  readonly paths: readonly ElectricalRoutingPath[];
} {
  const contacts = findWireContacts(project);
  const paths = getRelationPaths(project);
  addConnectedCrossings(project, paths, contacts);
  addSharedSpans(paths, contacts);
  return {
    relations: describeRelations(project, { contacts, paths }),
    paths: paths.map((path) => routingPath(path)),
  };
}

function describeRelations(
  project: Project,
  {
    contacts,
    paths,
  }: {
    readonly contacts: ReturnType<typeof findWireContacts>;
    readonly paths: readonly RelationPath[];
  },
): ElectricalRelations {
  return {
    controllerId: project.controllerId,
    wiring: project.wiring,
    keys: project.keys.map((key) => ({ id: key.id, half: key.half ?? 'left', diode: key.diode })),
    encoderPins: project.encoders.map((encoder) => ({
      id: encoder.id,
      half: encoder.half,
      wiringMode: encoder.wiringMode,
      aPin: encoder.aPin,
      bPin: encoder.bPin,
      pushKeyId: encoder.pushKeyId,
    })),
    wires: project.wires
      .map((wire) => ({
        id: wire.id,
        half: getWireHalf(project, wire),
        start: endpointMeaning(wire.start),
        end: endpointMeaning(wire.end),
      }))
      .toSorted((first, second) => compareText(first.id, second.id)),
    conductors: paths
      .toSorted(
        (first, second) => compareText(first.wireId, second.wireId) || first.order - second.order,
      )
      .map((path) => ({ wireId: path.wireId, id: path.id, sites: orderedSites(path) })),
    nets: getNets(project, contacts)
      .map((net) => netParticipants(net))
      .toSorted((first, second) => compareText(JSON.stringify(first), JSON.stringify(second))),
  };
}

function endpointMeaning(end: WireEnd) {
  return end.kind === 'junction' ? { kind: end.kind, wireId: end.wireId } : end;
}

function orderedSites(path: RelationPath): readonly (readonly string[])[] {
  const sorted = path.sites.toSorted(
    (first, second) => first.arc - second.arc || compareText(first.label, second.label),
  );
  const groups: { readonly arc: number; readonly labels: string[] }[] = [];
  for (const site of sorted) {
    appendSite(groups, site);
  }
  return groups.map((group) => [...new Set(group.labels)].toSorted(compareText));
}

function appendSite(
  groups: { readonly arc: number; readonly labels: string[] }[],
  site: RelationSite,
) {
  const last = groups.at(-1);
  if (last !== undefined && site.arc === last.arc) {
    last.labels.push(site.label);
  } else {
    groups.push({ arc: site.arc, labels: [site.label] });
  }
}

function netParticipants(net: Net): readonly string[] {
  return [
    ...net.wireIds.map((id) => `wire:${id}`),
    ...net.pins.map((pin) => `pin:${pin.keyId}:${pin.pin}`),
    ...net.terminalIds.map((id) => `terminal:${id}`),
    ...net.boardPins.map((pin) => `gpio:${pin.wireId}:${pin.side}:${pin.boardPin}`),
    ...(net.encoderPins ?? []).map((pin) => `encoder:${pin.encoderId}:${pin.pin}`),
  ].toSorted(compareText);
}

function routingPath(path: RelationPath): ElectricalRoutingPath {
  const sites = path.sites.toSorted(
    (first, second) => first.arc - second.arc || compareText(first.label, second.label),
  );
  const result: { readonly arc: number; readonly at: WirePoint; readonly labels: string[] }[] = [];
  for (const site of sites) {
    const previous = result.at(-1);
    if (previous?.arc === site.arc) {
      previous.labels.push(site.label);
    } else {
      result.push({
        arc: site.arc,
        at: site.at ?? pointAtArc(path, site.arc),
        labels: [site.label],
      });
    }
  }
  return {
    wireId: path.wireId,
    id: path.id,
    points: path.points,
    sites: result.map((site) => ({ at: site.at, labels: site.labels.toSorted(compareText) })),
  };
}
