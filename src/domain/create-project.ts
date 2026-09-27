import type { Project } from './types';

export function createProject(): Project {
  return { schemaVersion: 1, name: 'My keyboard' };
}
