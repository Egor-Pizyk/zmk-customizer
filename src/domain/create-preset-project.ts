import type { Project } from './types';

export function createPresetProject(preset: Project): Project {
  return structuredClone(preset);
}
