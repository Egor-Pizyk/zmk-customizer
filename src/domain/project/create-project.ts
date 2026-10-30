import type { Project } from '@domain';

export function createProject(input: { readonly controllerId: string }): Project {
  return {
    schemaVersion: 14,
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    controllerId: input.controllerId,
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
}
