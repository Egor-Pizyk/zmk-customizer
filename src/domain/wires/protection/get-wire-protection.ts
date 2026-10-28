import { findWireContacts } from '@domain/wires/contacts';
import type { WireContacts } from '@domain/wires/contacts';
import { getWireProtectionSnapshot } from './get-wire-protection-snapshot';
import { getWirePinContacts } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';

type Input = {
  readonly wireIds?: readonly string[];
  readonly encoderIds?: readonly string[];
  readonly keyIds?: readonly string[];
  readonly includeAttachments?: boolean;
  readonly terminalIds?: readonly string[];
};

export type WireProtection = {
  readonly wireId: string;
  readonly attachedWireIds?: readonly string[];
  readonly keyIds: readonly string[];
  readonly terminalIds: readonly string[];
};

export function getWireProtection(project: Project, input: Input = {}): readonly WireProtection[] {
  const contacts = input.includeAttachments === true ? findWireContacts(project) : undefined;
  return project.wires
    .filter((wire) => wire.locked === true)
    .flatMap((wire) => {
      const attachedWireIds =
        contacts === undefined ? undefined : getAttachedWireIds(project, wire, contacts);
      const details = {
        ...getDetails(project, wire),
        ...(attachedWireIds === undefined ? {} : { attachedWireIds }),
      };
      const matches =
        (input.wireIds === undefined &&
          input.keyIds === undefined &&
          input.terminalIds === undefined &&
          input.encoderIds === undefined) ||
        (input.wireIds?.includes(wire.id) ?? false) ||
        matchesEncoder(project, { wire, details, ids: input.encoderIds }) ||
        details.keyIds.some((id) => input.keyIds?.includes(id) ?? false) ||
        details.terminalIds.some((id) => input.terminalIds?.includes(id) ?? false) ||
        (contacts !== undefined &&
          (attachedWireIds ?? []).some((id) => input.wireIds?.includes(id) ?? false));
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

function matchesEncoder(
  project: Project,
  {
    wire,
    details,
    ids,
  }: {
    readonly wire: Wire;
    readonly details: WireProtection;
    readonly ids: readonly string[] | undefined;
  },
): boolean {
  if (ids === undefined) {
    return false;
  }
  return (
    [wire.start, wire.end].some(
      (end) => end.kind === 'encoder-pin' && ids.includes(end.encoderId),
    ) ||
    project.encoders.some(
      (encoder) =>
        ids.includes(encoder.id) &&
        encoder.pushKeyId !== undefined &&
        details.keyIds.includes(encoder.pushKeyId),
    )
  );
}
