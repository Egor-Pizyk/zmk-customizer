import type { Project } from './types';

export function createProject(input: { readonly controllerId: string }): Project {
  return {
    schemaVersion: 6,
    controllerId: input.controllerId,
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
}
