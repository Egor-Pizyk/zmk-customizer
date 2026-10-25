import type { Project } from '@domain';
import type { SchematicSelection } from './schematic-selection';

export function getKeySectionSelection(
  project: Project,
  input: {
    readonly keyIds: readonly string[];
    readonly sectionIds: readonly string[];
  },
): SchematicSelection {
  const keyIds = [...new Set(input.keyIds)];
  const sectionIds = [...new Set(input.sectionIds)];
  if (sectionIds.length > 0) {
    return {
      kind: 'sections',
      base: project,
      sectionIds,
      ...(keyIds.length > 0 ? { keyIds } : {}),
    };
  }
  return keyIds.length > 0 ? { kind: 'multi', keyIds, wireIds: [] } : undefined;
}
