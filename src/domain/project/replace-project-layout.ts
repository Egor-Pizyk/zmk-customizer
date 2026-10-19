import type { KeyGeometry, Project } from '@domain';
import { createProject } from './create-project';
import { PROJECT_BUDGET } from './project-budget';

export function replaceProjectLayout(
  project: Project,
  geometries: readonly KeyGeometry[],
): Project {
  if (geometries.length === 0 || geometries.length > PROJECT_BUDGET.keys) {
    return project;
  }
  return {
    ...createProject({ controllerId: project.controllerId }),
    name: project.name,
    keys: geometries.map((geometry, index) => ({ id: `k${index}`, ...geometry })),
  };
}
