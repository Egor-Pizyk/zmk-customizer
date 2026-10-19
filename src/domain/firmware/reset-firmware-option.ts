import type { Project } from '@domain';

export function resetFirmwareOption(project: Project, id: string): Project {
  if (!Object.hasOwn(project.firmware, id)) {
    return project;
  }
  return {
    ...project,
    firmware: Object.fromEntries(Object.entries(project.firmware).filter(([key]) => key !== id)),
  };
}
