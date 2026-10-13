import { findBinding } from './find-binding';
import type { Project } from '../types';

const KEY_SENDING_KINDS = new Set(['kp', 'sk', 'kt', 'mt', 'lt']);

/** Every selected key sends a key, so a key behavior can be switched keeping each key (spec 006 FR-008). */
export function isEveryKeySendingKey(
  project: Project,
  input: { readonly layerIndex: number; readonly keyIds: readonly string[] },
): boolean {
  return (
    input.keyIds.length > 0 &&
    input.keyIds.every((keyId) =>
      KEY_SENDING_KINDS.has(
        findBinding(project, { layerIndex: input.layerIndex, keyId })?.kind ?? '',
      ),
    )
  );
}
