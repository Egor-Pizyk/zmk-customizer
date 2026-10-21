import type { Project, Wire, WireContact } from '@domain';

export function getWirePinContacts(
  project: Pick<Project, 'wireContacts'>,
  wire: Wire,
): readonly WireContact[] {
  return [
    ...(wire.contacts ?? []),
    ...(wire.contactIds ?? []).flatMap((id) => {
      const contact = project.wireContacts?.[id];
      return contact === undefined || contact === false ? [] : [contact];
    }),
  ];
}
