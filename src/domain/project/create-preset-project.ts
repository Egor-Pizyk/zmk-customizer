import type { Project } from '@domain';

export function createPresetProject(preset: Project): Project {
  return structuredClone(preset);
}
