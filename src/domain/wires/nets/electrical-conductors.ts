import { getWirePath, getWirePinContacts, getKeyPinPosition } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';
import type { RelationPath } from './electrical-relation-types';
import { arcAt, compareText, locate, pathLength } from './relation-path-geometry';

export function getRelationPaths(project: Project): RelationPath[] {
  const paths = project.wires.flatMap((wire) => wirePaths(project, wire));
  for (const wire of project.wires) {
    const path = getWirePath(project, wire);
    for (const side of ['start', 'end'] as const) {
      const end = wire[side];
      if (end.kind !== 'junction') {
        continue;
      }
      const at = side === 'start' ? path[0] : path.at(-1);
      const label = `junction:${wire.id}:${side}`;
      const target = at === undefined ? undefined : locate(paths, { wireId: end.wireId, at });
      if (target !== undefined) {
        target.path.sites.push({ arc: target.arc, label, ...(at === undefined ? {} : { at }) });
      }
    }
  }
  return paths;
}

function wirePaths(project: Project, wire: Wire): RelationPath[] {
  const spine = createPath({
    wireId: wire.id,
    id: 'spine',
    order: 0,
    points: getWirePath(project, wire),
  });
  for (const side of ['start', 'end'] as const) {
    const arc = side === 'start' ? 0 : Math.max(spine.length, 1e-7);
    const at = side === 'start' ? spine.points[0] : spine.points.at(-1);
    spine.sites.push({
      arc,
      label: `end:${wire.id}:${side}`,
      ...(at === undefined ? {} : { at }),
    });
    const participant = endpointParticipant(wire[side], { wireId: wire.id, side });
    if (participant !== undefined) {
      spine.sites.push({
        arc,
        label: participant,
        ...(at === undefined ? {} : { at }),
      });
    }
  }
  return [spine, ...contactLeads(project, { wire, spine })];
}

function contactLeads(
  project: Project,
  { wire, spine }: { readonly wire: Wire; readonly spine: RelationPath },
): RelationPath[] {
  const contacts = getWirePinContacts(project, wire).toSorted((first, second) =>
    compareText(`${first.keyId}:${first.pin}`, `${second.keyId}:${second.pin}`),
  );
  return contacts.flatMap((contact, index) => {
    const key = project.keys.find((entry) => entry.id === contact.keyId);
    if (key === undefined) {
      return [];
    }
    const pin = getKeyPinPosition(key, contact.pin);
    const label = `contact:${wire.id}:${contact.keyId}:${contact.pin}`;
    const arc = arcAt(spine.points, contact.at);
    spine.sites.push({
      arc: arc ?? Infinity,
      at: contact.at,
      label: arc === undefined ? `${label}:off-path:${contact.at.xU}:${contact.at.yU}` : label,
    });
    const lead = createPath({
      wireId: wire.id,
      id: `lead:${contact.keyId}:${contact.pin}`,
      order: index + 1,
      points: [contact.at, { xU: pin.xU, yU: contact.at.yU }, pin],
    });
    lead.sites.push(
      { arc: 0, label, at: contact.at },
      { arc: Math.max(lead.length, 1e-7), label: `pin:${contact.keyId}:${contact.pin}`, at: pin },
    );
    return [lead];
  });
}

function createPath(input: Omit<RelationPath, 'length' | 'sites'>): RelationPath {
  return { ...input, length: pathLength(input.points), sites: [] };
}

function endpointParticipant(
  end: Wire['start'],
  input: { readonly wireId: string; readonly side: 'start' | 'end' },
): string | undefined {
  if (end.kind === 'key-pin') {
    return `pin:${end.keyId}:${end.pin}`;
  }
  if (end.kind === 'encoder-pin') {
    return `encoder:${end.encoderId}:${end.pin}`;
  }
  return end.kind === 'junction' ? `junction:${input.wireId}:${input.side}` : undefined;
}
