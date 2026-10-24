import { pasteKeys } from './paste-keys';
import type { Project } from '@domain';

export function duplicateKeys(
  project: Project,
  input: { readonly keyIds: readonly string[]; readonly maxKeyCount: number },
): Project {
  return pasteKeys(project, {
    clipboard: {
      keys: project.keys.filter((key) => input.keyIds.includes(key.id)),
      layers: project.layers,
    },
    maxKeyCount: input.maxKeyCount,
  });
}
