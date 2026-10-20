import * as z from 'zod';
import type { Project, Wire } from '@domain';
import { getWirePinContacts } from '@domain/wires/geometry';

type Issue = { readonly message: string; readonly path: readonly (string | number)[] };
export const contactSchema = z.strictObject({
  keyId: z.string(),
  pin: z.literal([1, 2]),
  at: z.strictObject({ xU: z.number(), yU: z.number() }),
});

export function findWireContactReferenceIssues(
  project: Project,
  wire: Wire,
  index: number,
): Issue[] {
  const keyIds = new Set(project.keys.map((key) => key.id));
  const issues: Issue[] = [];
  for (const id of wire.contactIds ?? []) {
    if (project.wireContacts?.[id] === undefined || project.wireContacts[id] === false) {
      issues.push({
        message: 'Expected an existing contact pool entry',
        path: ['wires', index, 'contactIds'],
      });
    }
  }
  const seen = new Set(
    [wire.start, wire.end].flatMap((end) =>
      end.kind === 'key-pin' ? [`${end.keyId}:${end.pin}`] : [],
    ),
  );
  for (const [contactIndex, contact] of getWirePinContacts(project, wire).entries()) {
    const identity = `${contact.keyId}:${contact.pin}`;
    if (!keyIds.has(contact.keyId) || seen.has(identity)) {
      issues.push({
        message: 'Expected an existing, unique intermediate key pin',
        path: ['wires', index, 'contacts', contactIndex],
      });
    }
    seen.add(identity);
  }
  return issues;
}

export function findContactPoolIssues(project: Project): Issue[] {
  const keys = new Set(project.keys.map((key) => key.id));
  return (project.wireContacts ?? []).flatMap((contact, index) =>
    contact !== false && !keys.has(contact.keyId)
      ? [
          {
            message: 'Expected an existing key for the shared contact',
            path: ['wireContacts', index],
          },
        ]
      : [],
  );
}
