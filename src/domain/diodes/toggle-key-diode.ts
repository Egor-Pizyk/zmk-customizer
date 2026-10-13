import { getKeyDiodeState } from './get-key-diode-state';
import type { Project, KeyPin } from '../types';

export function toggleKeyDiode(
  project: Project,
  input: { readonly keyId: string; readonly pin: KeyPin },
): Project {
  const key = project.keys.find((candidate) => candidate.id === input.keyId);
  const state = getKeyDiodeState(key, input.pin);
  if (key === undefined || state.isDisabled) {
    return project;
  }
  const { diode: _diode, ...withoutDiode } = key;
  const replacement = state.isPresent
    ? withoutDiode
    : { ...key, diode: { pin: input.pin, cathode: 'away-switch' as const } };
  return {
    ...project,
    keys: project.keys.map((candidate) => (candidate.id === key.id ? replacement : candidate)),
  };
}
