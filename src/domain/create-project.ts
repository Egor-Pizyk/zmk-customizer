import type { Project } from './types';

export function createProject(): Project {
  return {
    schemaVersion: 5,
    controllerId: 'nice_nano_v2',
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
}
