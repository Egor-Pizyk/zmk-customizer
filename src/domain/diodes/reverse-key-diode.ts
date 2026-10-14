import type { Project, KeyDiode } from '@domain';

export function reverseKeyDiode(project: Project, input: { readonly keyId: string }): Project {
  const key = project.keys.find((candidate) => candidate.id === input.keyId);
  if (key?.diode === undefined) {
    return project;
  }
  const cathode: KeyDiode['cathode'] =
    key.diode.cathode === 'away-switch' ? 'toward-switch' : 'away-switch';
  const replacement = { ...key, diode: { ...key.diode, cathode } };
  return {
    ...project,
    keys: project.keys.map((candidate) => (candidate.id === key.id ? replacement : candidate)),
  };
}
