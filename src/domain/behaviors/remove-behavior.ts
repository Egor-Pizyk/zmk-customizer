import type { Project } from '@domain';

export function removeBehavior(project: Project, behaviorId: string): Project {
  if (!project.behaviors.some((behavior) => behavior.id === behaviorId)) {
    return project;
  }
  return {
    ...project,
    behaviors: project.behaviors.filter((behavior) => behavior.id !== behaviorId),
  };
}
