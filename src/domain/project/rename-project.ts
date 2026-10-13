import type { Project } from '../types';

export function renameProject(project: Project, input: { readonly name: string }): Project {
  if (project.name === input.name) {
    return project;
  }
  return { ...project, name: input.name };
}
