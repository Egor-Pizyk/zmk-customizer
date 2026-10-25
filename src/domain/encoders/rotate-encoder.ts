import type { Project } from '@domain';
import { getEncoderGeometry } from '@domain/geometry';
import { editLayout } from '@domain/keys';
import { replaceEncoder } from './replace-encoder';

export function rotateEncoder(
  project: Project,
  input: { readonly encoderId: string; readonly rotationDeg: number },
): Project {
  const encoder = project.encoders.find((entry) => entry.id === input.encoderId);
  if (
    encoder === undefined ||
    getEncoderGeometry(project, encoder).rotationDeg === input.rotationDeg
  ) {
    return project;
  }
  const key = project.keys.find((entry) => entry.id === encoder.pushKeyId);
  if (key !== undefined) {
    return editLayout(project, {
      keyIds: [key.id],
      offset: { xU: 0, yU: 0 },
      geometry: { rotationDeg: input.rotationDeg },
    });
  }
  return replaceEncoder(project, { ...encoder, rotationDeg: input.rotationDeg });
}
