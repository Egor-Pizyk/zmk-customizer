import { getWirePinContacts, getWireConductors } from '@domain/wires/geometry';
import type { Project, Wire, WirePoint } from '@domain';
import { getWireHalf } from '@domain/wiring';
import { createSectionEndLabel } from './get-section-end-label';
import { getOverlapBoundaries } from './get-overlap-boundaries';
import { findWireContacts } from './find-wire-contacts';

export type WireSection = {
  readonly id: string;
  readonly wireId: string;
  readonly conductorIndex: number;
  readonly path: readonly WirePoint[];
  readonly contributors: readonly string[];
  readonly description: string;
};

export function getWireSections(
  project: Project,
  input: { readonly includeSharedContributors?: boolean } = {},
): readonly WireSection[] {
  const contacts = findWireContacts(project);
  const geometry = new Map(
    project.wires.map((wire) => {
      const paths = getWireConductors(project, wire);
      const boundaries = getBoundaries(project, wire);
      return [
        wire.id,
        { paths, boundaries, signature: JSON.stringify([paths, boundaries]) },
      ] as const;
    }),
  );
  const peers = indexOverlaps(contacts.overlaps);
  const sections = project.wires.flatMap((wire) => {
    const boundaries = [...(geometry.get(wire.id)?.boundaries ?? [])];
    appendOverlapBoundaries({
      wireId: wire.id,
      peers: peers.get(wire.id) ?? [],
      boundaries,
      geometry,
    });
    appendCrossingBoundaries(project, wire, { crossings: contacts.crossings, boundaries });
    return (geometry.get(wire.id)?.paths ?? []).flatMap((path, conductorIndex) =>
      splitPath(path, boundaries).map((section, index) => ({
        id: `${wire.id}:${conductorIndex}:${index}`,
        wireId: wire.id,
        conductorIndex,
        path: section,
        contributors: [],
        description: '',
      })),
    );
  });
  const grouped = groupSections(project, sections, input.includeSharedContributors === true);
  return input.includeSharedContributors === true ? grouped : describeSections(project, grouped);
}

function getBoundaries(project: Project, wire: Wire): WirePoint[] {
  const points = getWirePinContacts(project, wire).map((contact) => contact.at);
  if (wire.anchors !== undefined) {
    points.push(wire.anchors.start, wire.anchors.end);
  }
  for (const other of project.wires) {
    for (const end of [other.start, other.end]) {
      if (end.kind === 'junction' && end.wireId === wire.id) {
        points.push(end.at);
      }
    }
  }
  return points;
}

function splitPath(path: readonly WirePoint[], boundaries: readonly WirePoint[]): WirePoint[][] {
  const result: WirePoint[][] = [];
  const first = path[0];
  if (first === undefined) {
    return result;
  }
  let current = [first];
  for (const [index, to] of path.slice(1).entries()) {
    const from = path[index] ?? to;
    const distance = (point: WirePoint) =>
      Math.abs(point.xU - from.xU) + Math.abs(point.yU - from.yU);
    const length = distance(to);
    if (length === 0) {
      continue;
    }
    const cuts = findCuts(boundaries, { from, to });
    for (const cut of cuts) {
      if (samePoint(current.at(-1), cut)) {
        continue;
      }
      current.push(cut);
      result.push(current);
      current = [cut];
    }
    current.push(to);
    if (boundaries.some((at) => samePoint(at, to))) {
      result.push(current);
      current = [to];
    }
  }
  if (current.length > 1) {
    result.push(current);
  }
  return result;
}

function samePoint(one: WirePoint | undefined, other: WirePoint): boolean {
  return one?.xU === other.xU && one.yU === other.yU;
}

function groupSections(
  project: Project,
  sections: readonly WireSection[],
  includeSharedContributors: boolean,
): readonly WireSection[] {
  const halves = new Map(project.wires.map((wire) => [wire.id, getWireHalf(project, wire)]));
  const groups = new Map<string, WireSection[]>();
  for (const section of sections) {
    const path = normalizePath(section.path);
    const forward = JSON.stringify(path);
    const reverse = JSON.stringify(path.toReversed());
    const identity = `${halves.get(section.wireId)}:${forward < reverse ? forward : reverse}`;
    const group = groups.get(identity) ?? [];
    group.push(section);
    groups.set(identity, group);
  }
  const contributors = new Map<string, readonly string[]>();
  for (const group of groups.values()) {
    const ids = group.map((section) => section.id);
    for (const section of group) {
      contributors.set(section.id, ids);
    }
  }
  const visible = includeSharedContributors
    ? sections
    : [...groups.values()].flatMap((group) => group.slice(0, 1));
  return visible.map((section) => withContributors(section, contributors.get(section.id) ?? []));
}

type SectionGeometry = {
  readonly paths: readonly (readonly WirePoint[])[];
  readonly boundaries: readonly WirePoint[];
  readonly signature: string;
};
function appendOverlapBoundaries({
  wireId,
  peers,
  boundaries,
  geometry,
}: {
  readonly wireId: string;
  readonly peers: readonly string[];
  readonly boundaries: WirePoint[];
  readonly geometry: ReadonlyMap<string, SectionGeometry>;
}) {
  const own = geometry.get(wireId);
  const seen = new Set([own?.signature]);
  for (const id of peers) {
    const other = geometry.get(id);
    if (own === undefined || other === undefined || seen.has(other.signature)) {
      continue;
    }
    seen.add(other.signature);
    boundaries.push(
      ...other.paths.flatMap((path) => getOverlapBoundaries(path, own.paths)),
      ...own.paths.flatMap((path) => getOverlapBoundaries(path, other.paths)),
      ...other.boundaries,
    );
  }
}

function indexOverlaps(overlaps: readonly (readonly [string, string])[]) {
  const peers = new Map<string, string[]>();
  for (const [first, second] of overlaps) {
    for (const [id, other] of [
      [first, second],
      [second, first],
    ] as const) {
      const entries = peers.get(id) ?? [];
      entries.push(other);
      peers.set(id, entries);
    }
  }
  return peers;
}

function describeSections(project: Project, sections: readonly WireSection[]) {
  const labels = new Map<string, ReturnType<typeof createSectionEndLabel>>();
  return sections.map((section) => {
    const wire = project.wires.find((entry) => entry.id === section.wireId);
    if (wire === undefined) {
      return section;
    }
    const label = labels.get(wire.id) ?? createSectionEndLabel(project, wire);
    labels.set(wire.id, label);
    return {
      ...section,
      description: `${label(section.path[0] ?? { xU: 0, yU: 0 })} to ${label(section.path.at(-1) ?? { xU: 0, yU: 0 })}`,
    };
  });
}

function findCuts(
  boundaries: readonly WirePoint[],
  { from, to }: { readonly from: WirePoint; readonly to: WirePoint },
) {
  const distance = (point: WirePoint) =>
    Math.abs(point.xU - from.xU) + Math.abs(point.yU - from.yU);
  const length = distance(to);
  return boundaries
    .filter(
      (at) =>
        distance(at) > 0 &&
        distance(at) < length &&
        Math.abs(distance(at) + Math.abs(at.xU - to.xU) + Math.abs(at.yU - to.yU) - length) <
          0.00001,
    )
    .toSorted((one, other) => distance(one) - distance(other));
}

function normalizePath(path: readonly WirePoint[]): readonly WirePoint[] {
  return path.filter((point, index) => {
    const before = path[index - 1];
    const after = path[index + 1];
    return (
      before === undefined ||
      after === undefined ||
      !(
        ((before.xU === point.xU && point.xU === after.xU) ||
          (before.yU === point.yU && point.yU === after.yU)) &&
        point.xU >= Math.min(before.xU, after.xU) &&
        point.xU <= Math.max(before.xU, after.xU) &&
        point.yU >= Math.min(before.yU, after.yU) &&
        point.yU <= Math.max(before.yU, after.yU)
      )
    );
  });
}

function withContributors(section: WireSection, contributors: readonly string[]) {
  return { ...section, contributors };
}

function appendCrossingBoundaries(
  project: Project,
  wire: Wire,
  {
    crossings,
    boundaries,
  }: {
    readonly crossings: ReturnType<typeof findWireContacts>['crossings'];
    readonly boundaries: WirePoint[];
  },
) {
  for (const crossing of crossings) {
    const insulated = project.insulatedCrossings.some(
      (entry) =>
        entry.ordinal === crossing.ordinal &&
        entry.wireIds[0] === crossing.wireIds[0] &&
        entry.wireIds[1] === crossing.wireIds[1],
    );
    if (!insulated && crossing.wireIds.includes(wire.id)) {
      boundaries.push(crossing.at);
    }
  }
}
