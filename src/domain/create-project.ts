import type { Project } from './types';

export function createProject(): Project {
  return { schemaVersion: 2, name: 'My keyboard', keys: [], wires: [], insulatedCrossings: [] };
}
