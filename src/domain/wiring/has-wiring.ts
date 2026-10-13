import type { Project, Wiring } from '../types';

export function hasWiring(project: Project): project is Project & { readonly wiring: Wiring } {
  return project.wiring !== undefined;
}
