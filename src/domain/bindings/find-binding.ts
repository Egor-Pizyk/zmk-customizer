import type { Binding, Project } from '../types';

/** Undefined = unassigned, which behaves as &none (spec 004 FR-021). */
export function findBinding(
  project: Project,
  input: { readonly layerIndex: number; readonly keyId: string },
): Binding | undefined {
  return project.layers[input.layerIndex]?.bindings[input.keyId];
}
