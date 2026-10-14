import { removeKey } from './remove-key';
import type { Project } from '@domain';

export function removeKeys(
  project: Project,
  input: { readonly keyIds: readonly string[] },
): Project {
  let next = project;
  for (const keyId of input.keyIds) {
    next = removeKey(next, { keyId });
  }
  return next;
}
