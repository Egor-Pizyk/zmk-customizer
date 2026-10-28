import { findWireContacts } from '@domain/wires/contacts';
import type { WireContacts } from '@domain/wires/contacts';
import { getWireProtectionSnapshot } from './get-wire-protection-snapshot';
import { getWirePinContacts } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';

type Input = {
  readonly wireIds?: readonly string[];
  readonly keyIds?: readonly string[];
  readonly includeAttachments?: boolean;
  readonly terminalIds?: readonly string[];
};

export type WireProtection = {
  readonly wireId: string;
  readonly keyIds: readonly string[];
  readonly terminalIds: readonly string[];
};

export function getWireProtection(project: Project, input: Input = {}): readonly WireProtection[] {
  const contacts = input.includeAttachments === true ? findWireContacts(project) : undefined;
  return project.wires
    .filter((wire) => wire.locked === true)
    .flatMap((wire) => {
      const details = getDetails(project, wire);
      const matches =
        (input.wireIds === undefined &&
          input.keyIds === undefined &&
          input.terminalIds === undefined) ||
        (input.wireIds?.includes(wire.id) ?? false) ||
        details.keyIds.some((id) => input.keyIds?.includes(id) ?? false) ||
        details.terminalIds.some((id) => input.terminalIds?.includes(id) ?? false) ||
        (contacts !== undefined &&
          getAttachedWireIds(project, wire, contacts).some(
            (id) => input.wireIds?.includes(id) ?? false,
          ));
      return matches ? [details] : [];
    });
}

function getDetails(project: Project, wire: Wire): WireProtection {
  const keyIds = [
    ...new Set(
      [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((pin) =>
        'keyId' in pin ? [pin.keyId] : [],
      ),
    ),
  ];
  const terminalIds = [wire.start, wire.end].flatMap((end) =>
    end.kind === 'free' && end.terminalId !== undefined ? [end.terminalId] : [],
  );
  return { wireId: wire.id, keyIds, terminalIds };
}

function getAttachedWireIds(project: Project, wire: Wire, contacts: WireContacts) {
  const snapshot = getWireProtectionSnapshot(project, wire, contacts);
  return [
    ...[wire.start, wire.end].flatMap((end) => (end.kind === 'junction' ? [end.wireId] : [])),
    ...snapshot.junctions.map((entry) => entry.wireId),
    ...snapshot.crossings.flatMap((entry) => entry.wireIds),
    ...snapshot.overlaps.map((entry) => entry.wireId),
  ];
}
