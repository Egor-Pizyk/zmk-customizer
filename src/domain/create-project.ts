import type { Project } from './types';

export function createProject(): Project {
  return {
    schemaVersion: 3,
    name: 'My keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
}
