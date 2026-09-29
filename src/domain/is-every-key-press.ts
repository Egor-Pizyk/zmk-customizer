import { findBinding } from './find-binding';
import type { Project } from './types';

/** Modifier chips change the keys at once only when all of them send a key: kp or mod-tap (FR-011). */
export function isEveryKeyPress(
  project: Project,
  input: { readonly layerIndex: number; readonly keyIds: readonly string[] },
): boolean {
  return (
    input.keyIds.length > 0 &&
    input.keyIds.every((keyId) => {
      const kind = findBinding(project, { layerIndex: input.layerIndex, keyId })?.kind;
      return kind === 'kp' || kind === 'mt';
    })
  );
}
