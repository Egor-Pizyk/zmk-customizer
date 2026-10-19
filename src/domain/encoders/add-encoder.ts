import type { Project } from '@domain';
import { createEntityId } from '@domain/project';

export function addEncoder(
  project: Project,
  defaults: { readonly steps: number; readonly triggersPerRotation: number },
): Project {
  const id = createEntityId({
    prefix: 'e',
    existingIds: project.encoders.map((encoder) => encoder.id),
  });
  let xU = 0;
  for (const key of project.keys) {
    xU = Math.max(xU, key.xU + (key.widthU ?? 1) + 1);
  }
  for (const encoder of project.encoders) {
    xU = Math.max(xU, encoder.xU + 2);
  }
  return {
    ...project,
    encoders: [
      ...project.encoders,
      {
        id,
        xU,
        yU: 0,
        half: 'left',
        ...defaults,
      },
    ],
  };
}
