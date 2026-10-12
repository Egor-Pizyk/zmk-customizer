import { moveKeys } from './move-keys';
import type { Project, WirePoint } from './types';

export function moveKey(
  project: Project,
  input: { readonly keyId: string; readonly position: WirePoint },
): Project {
  return moveKeys(project, { moves: [input] });
}
