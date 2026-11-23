import { validateWireProtection } from '@domain/wires/protection';
import { getWireSections } from '@domain/wires';
import { findWireContacts } from '@domain/wires/contacts';
import { getSurvivingWireSpans } from './get-surviving-wire-spans';
import {
  getWirePinContacts,
  getWirePath,
  getKeyPinPosition,
  getWireHalf,
} from '@domain/wires/geometry';
import type { Project, Result, Wire, WireEnd, WirePoint } from '@domain';
import type { WireSection } from '@domain/wires';

import { getNets } from '@domain/wires/nets';
import { createEntityId, getProjectResourceError } from '@domain/project';

function removeWireSectionsCandidate(
  project: Project,
  input: { readonly base: Project; readonly sectionIds: readonly string[] },
): Result<Project, string> {
  if (input.base !== project) {
    return { ok: false, error: 'The selected project changed. Select the wire sections again.' };
  }
  const sections = getWireSections(project, { includeSharedContributors: true });
  const selectedIds = getSelectedSectionIds(sections, input.sectionIds);
  if (input.sectionIds.some((id) => !sections.some((section) => section.id === id))) {
    return { ok: false, error: 'The selected wire sections changed. Select them again.' };
  }
  if (input.sectionIds.length === 0) {
    return { ok: true, value: project };
  }
  const affected = new Set(
    sections.filter((section) => selectedIds.has(section.id)).map((section) => section.wireId),
  );
  const ids = project.wires.map((wire) => wire.id);
  const parentById = new Map<string, string>();
  const wires = project.wires.flatMap((wire) => {
    if (!affected.has(wire.id)) {
      return [wire];
    }
    return getSurvivingWireSpans(
      sections.filter((section) => section.wireId === wire.id),
      selectedIds,
    ).map((section, index) => {
      const id = index === 0 ? wire.id : createEntityId({ prefix: 'w', existingIds: ids });
      ids.push(id);
      parentById.set(id, wire.id);
      return fragment(project, { wire, section, id });
    });
  });
  const candidate = { ...project, wires };
  const remapped = remapEnds(project, candidate, { affected, parentById });
  const insulatedCrossings = remapInsulation(project, remapped, parentById);
  const next = { ...remapped, insulatedCrossings };
  return acceptFragments(next);
}

function fragment(
  project: Project,
  {
    wire,
    section,
    id,
  }: { readonly wire: Wire; readonly section: WireSection; readonly id: string },
): Wire {
  const start = section.path[0] ?? { xU: 0, yU: 0 };
  const end = section.path.at(-1) ?? start;
  return {
    id,
    ...(project.wiring?.topology === 'split' ? { half: getWireHalf(project, wire) } : {}),
    start: endpoint(project, wire, start),
    end: endpoint(project, wire, end),
    bends: section.path.slice(1, -1),
    ...getFragmentContacts(project, wire, section.path),
    anchors: { start, end },
  };
}

function endpoint(project: Project, wire: Wire, at: WirePoint): WireEnd {
  for (const end of [wire.start, wire.end]) {
    const path = getWirePath(project, wire);
    const position = end === wire.start ? path[0] : path.at(-1);
    if (samePoint(position, at)) {
      return end;
    }
  }
  for (const contact of getWirePinContacts(project, wire)) {
    const key = project.keys.find((entry) => entry.id === contact.keyId);
    if (key !== undefined && samePoint(getKeyPinPosition(key, contact.pin), at)) {
      return { kind: 'key-pin', keyId: contact.keyId, pin: contact.pin };
    }
  }
  return { kind: 'free', at };
}

type Remap = {
  readonly affected: ReadonlySet<string>;
  readonly parentById: ReadonlyMap<string, string>;
};

function remapEnds(before: Project, candidate: Project, context: Remap): Project {
  const nets = getNets(before);
  const netByWire = new Map(
    nets.flatMap((net, index) => net.wireIds.map((id) => [id, index] as const)),
  );
  const wires = candidate.wires.map((wire) => remapWire(wire, { candidate, context, netByWire }));
  return { ...candidate, wires };
}

function remapInsulation(
  before: Project,
  candidate: Project,
  parents: ReadonlyMap<string, string>,
) {
  const old = findWireContacts(before).crossings.filter((crossing) =>
    before.insulatedCrossings.some(
      (ref) =>
        ref.wireIds[0] === crossing.wireIds[0] &&
        ref.wireIds[1] === crossing.wireIds[1] &&
        ref.ordinal === crossing.ordinal,
    ),
  );
  return findWireContacts(candidate)
    .crossings.filter((crossing) => {
      const ids = crossing.wireIds.map((id) => parents.get(id) ?? id).toSorted();
      return old.some(
        (entry) =>
          entry.wireIds[0] === ids[0] &&
          entry.wireIds[1] === ids[1] &&
          samePoint(entry.at, crossing.at),
      );
    })
    .map(({ wireIds, ordinal }) => ({ wireIds, ordinal }));
}

function onPath(path: readonly WirePoint[], at: WirePoint): boolean {
  return path.some((from, index) => {
    const to = path[index + 1] ?? from;
    return (
      at.xU >= Math.min(from.xU, to.xU) &&
      at.xU <= Math.max(from.xU, to.xU) &&
      at.yU >= Math.min(from.yU, to.yU) &&
      at.yU <= Math.max(from.yU, to.yU)
    );
  });
}

function samePoint(one: WirePoint | undefined, other: WirePoint): boolean {
  return (
    one !== undefined &&
    Math.abs(one.xU - other.xU) < 0.00001 &&
    Math.abs(one.yU - other.yU) < 0.00001
  );
}

function remapWire(
  wire: Wire,
  input: {
    readonly candidate: Project;
    readonly context: Remap;
    readonly netByWire: ReadonlyMap<string, number>;
  },
): Wire {
  return {
    ...wire,
    start: remapEnd(wire.start, { ...input, wire }),
    end: remapEnd(wire.end, { ...input, wire }),
  };
}
type EndRemapInput = {
  readonly wire: Wire;
  readonly candidate: Project;
  readonly context: Remap;
  readonly netByWire: ReadonlyMap<string, number>;
};

function remapEnd(end: WireEnd, { wire, candidate, context, netByWire }: EndRemapInput): WireEnd {
  if (end.kind === 'key-pin') {
    return end;
  }
  if (end.kind === 'junction' && context.affected.has(end.wireId)) {
    const target = candidate.wires.find(
      (other) =>
        other.id !== wire.id &&
        context.parentById.get(other.id) === end.wireId &&
        onPath(getWirePath(candidate, other), end.at),
    );
    return target === undefined ? { kind: 'free', at: end.at } : { ...end, wireId: target.id };
  }
  if (
    end.kind !== 'free' ||
    end.terminalId !== undefined ||
    end.boardPin !== undefined ||
    !context.parentById.has(wire.id)
  ) {
    return end;
  }
  const parent = context.parentById.get(wire.id) ?? wire.id;
  const target = candidate.wires.find(
    (other) =>
      other.id < wire.id &&
      netByWire.get(context.parentById.get(other.id) ?? other.id) === netByWire.get(parent) &&
      onPath(getWirePath(candidate, other), end.at),
  );
  return target === undefined ? end : { kind: 'junction', wireId: target.id, at: end.at };
}

function acceptFragments(project: Project): Result<Project, string> {
  const error = getProjectResourceError(project);
  return error === undefined ? { ok: true, value: project } : { ok: false, error };
}

function getSelectedSectionIds(sections: readonly WireSection[], sectionIds: readonly string[]) {
  return new Set(
    sections
      .filter((section) => sectionIds.includes(section.id))
      .flatMap((section) => section.contributors),
  );
}

function getFragmentContacts(project: Project, wire: Wire, path: readonly WirePoint[]) {
  const ends = [path[0], path.at(-1)].flatMap((at) =>
    at === undefined ? [] : [endpoint(project, wire, at)],
  );
  const keys = new Map(project.keys.map((key) => [key.id, key]));
  const keep = (contact: ReturnType<typeof getWirePinContacts>[number]) => {
    const key = keys.get(contact.keyId);
    return (
      key !== undefined &&
      samePoint(getKeyPinPosition(key, contact.pin), contact.at) &&
      onPath(path, contact.at) &&
      !ends.some(
        (end) => end.kind === 'key-pin' && end.keyId === contact.keyId && end.pin === contact.pin,
      )
    );
  };
  return {
    contacts: (wire.contacts ?? []).filter((contact) => keep(contact)),
    ...(wire.contactIds === undefined
      ? {}
      : {
          contactIds: wire.contactIds.filter((id) => {
            const contact = project.wireContacts?.[id];
            return contact !== undefined && contact !== false && keep(contact);
          }),
        }),
  };
}

export function removeWireSections(
  project: Project,
  input: Parameters<typeof removeWireSectionsCandidate>[1],
): Result<Project, string> {
  const result = removeWireSectionsCandidate(project, input);
  if (!result.ok) {
    return result;
  }
  const issue = validateWireProtection(project, result.value)[0];
  return issue === undefined ? result : { ok: false, error: issue.message };
}
