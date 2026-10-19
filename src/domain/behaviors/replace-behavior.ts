import type { CustomBehavior, Project } from '@domain';

export function replaceBehavior(project: Project, behavior: CustomBehavior): Project {
  const existing = project.behaviors.find((entry) => entry.id === behavior.id);
  if (existing === undefined || JSON.stringify(existing) === JSON.stringify(behavior)) {
    return project;
  }
  return {
    ...project,
    behaviors: project.behaviors.map((entry) => (entry.id === behavior.id ? behavior : entry)),
  };
}
