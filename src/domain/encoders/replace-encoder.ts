import type { Encoder, Project } from '@domain';

export function replaceEncoder(project: Project, encoder: Encoder): Project {
  if (!project.encoders.some((entry) => entry.id === encoder.id)) {
    return project;
  }
  return {
    ...project,
    encoders: project.encoders.map((entry) => (entry.id === encoder.id ? encoder : entry)),
  };
}
