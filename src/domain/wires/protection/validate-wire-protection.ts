import { getWirePinContacts } from '@domain/wires/geometry';
import { findWireContacts } from '@domain/wires/contacts';
import { getWireProtectionSnapshot } from './get-wire-protection-snapshot';
import type { Project, ValidationIssue, Wire } from '@domain';

export function validateWireProtection(
  base: Project,
  candidate: Project,
): readonly ValidationIssue[] {
  const locked = base.wires.filter((wire) => wire.locked === true);
  if (locked.length === 0 || base === candidate || isLockOnlyChange(base, candidate)) {
    return [];
  }
  const byId = new Map(candidate.wires.map((wire) => [wire.id, wire]));
  const changed = locked.filter(
    (wire) =>
      JSON.stringify(wire) !== JSON.stringify(byId.get(wire.id)) || hasMissingPin(candidate, wire),
  );
  if (changed.length > 0) {
    return changed.map((wire) => lockedIssue(base, wire));
  }
  const beforeContacts = findWireContacts(base);
  const afterContacts = findWireContacts(candidate);
  return locked
    .filter((wire) => {
      const next = byId.get(wire.id);
      return (
        next === undefined ||
        JSON.stringify(getWireProtectionSnapshot(base, wire, beforeContacts)) !==
          JSON.stringify(getWireProtectionSnapshot(candidate, next, afterContacts))
      );
    })
    .map((wire) => lockedIssue(base, wire));
}

function lockedIssue(project: Project, wire: Wire): ValidationIssue {
  return {
    code: 'wire-locked',
    message: `Wire ${wire.id} is locked. Unlock it before changing this connection.`,
    path: ['wires', project.wires.indexOf(wire)],
  };
}

function isLockOnlyChange(base: Project, candidate: Project): boolean {
  return JSON.stringify(withoutLocks(base)) === JSON.stringify(withoutLocks(candidate));
}

function hasMissingPin(project: Project, wire: Wire): boolean {
  return [wire.start, wire.end, ...getWirePinContacts(project, wire)].some((end) => {
    if ('keyId' in end) {
      return !project.keys.some((key) => key.id === end.keyId);
    }
    return (
      end.kind === 'encoder-pin' &&
      !project.encoders.some((encoder) => encoder.id === end.encoderId)
    );
  });
}

function withoutLocks(project: Project) {
  return {
    ...project,
    wires: project.wires.map((wire) => {
      const { locked: _removed, ...rest } = wire;
      return rest;
    }),
  };
}
