import { findBinding } from './find-binding';
import { isSameBinding } from './is-same-binding';
import type { Binding, Project } from './types';

export type SharedBinding =
  | { readonly kind: 'unassigned' }
  | { readonly kind: 'same'; readonly binding: Binding }
  | { readonly kind: 'mixed' };

// What the Action panel shows as current for the selected keys (spec 004 FR-009a, FR-016).
// A missing layer reads as unassigned (findBinding yields undefined); the returned binding is
// the live project reference, kept readonly by type (callers must not mutate it).
export function getSharedBinding(
  project: Project,
  input: { readonly layerIndex: number; readonly keyIds: readonly string[] },
): SharedBinding {
  const bindings = input.keyIds.map((keyId) =>
    findBinding(project, { layerIndex: input.layerIndex, keyId }),
  );
  const [first] = bindings;
  if (!bindings.every((binding) => isSameBinding(binding, first))) {
    return { kind: 'mixed' };
  }
  return first === undefined ? { kind: 'unassigned' } : { kind: 'same', binding: first };
}
