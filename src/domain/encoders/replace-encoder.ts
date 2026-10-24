import type { Encoder, Key, Project } from '@domain';
import { getEncoderGeometry } from '@domain/geometry';
import { setKeyGeometries, preserveKeyWiring } from '@domain/keys';

function hasRotaryWires(project: Project, encoder: Encoder): boolean {
  return project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (end) => end.kind === 'encoder-pin' && end.encoderId === encoder.id,
    ),
  );
}

function transformPushKey(
  project: Project,
  input: { previous: Encoder; encoder: Encoder; key: Key },
): Project {
  const { previous, encoder, key } = input;
  const geometry = getEncoderGeometry(project, previous);
  const xU = encoder.xU === previous.xU ? geometry.xU : encoder.xU;
  const yU = encoder.yU === previous.yU ? geometry.yU : encoder.yU;
  const rotationDeg =
    encoder.rotationDeg === previous.rotationDeg
      ? geometry.rotationDeg
      : (encoder.rotationDeg ?? 0);
  return setKeyGeometries(project, {
    changes: [
      {
        keyId: key.id,
        geometry: {
          xU: xU + 0.5 - (key.widthU ?? 1) / 2,
          yU: yU + 0.5 - (key.heightU ?? 1) / 2,
          rotationDeg,
          rotationOriginXU: xU + 0.5,
          rotationOriginYU: yU + 0.5,
        },
      },
    ],
  });
}

function setPushHalf(project: Project, encoder: Encoder): Project {
  const key = project.keys.find((entry) => entry.id === encoder.pushKeyId);
  if (key === undefined || key.half === encoder.half) {
    return project;
  }
  const nextKey = { ...key, half: encoder.half };
  return { ...project, keys: project.keys.map((entry) => (entry.id === key.id ? nextKey : entry)) };
}

export function replaceEncoder(project: Project, encoder: Encoder): Project {
  const previous = project.encoders.find((entry) => entry.id === encoder.id);
  if (previous === undefined) {
    return project;
  }
  if (
    previous.wiringMode === 'schematic' &&
    encoder.wiringMode !== 'schematic' &&
    hasRotaryWires(project, encoder)
  ) {
    return project;
  }
  const key = project.keys.find((entry) => entry.id === previous.pushKeyId);
  const hasTransform =
    encoder.xU !== previous.xU ||
    encoder.yU !== previous.yU ||
    encoder.rotationDeg !== previous.rotationDeg;
  const next = {
    ...project,
    encoders: project.encoders.map((entry) => (entry.id === encoder.id ? encoder : entry)),
  };
  if (key === undefined) {
    return hasTransform ? preserveKeyWiring(project, next) : next;
  }
  if (!hasTransform) {
    return setPushHalf(next, encoder);
  }
  const transformed = transformPushKey(project, { previous, encoder, key });
  if (transformed === project) {
    return project;
  }
  return setPushHalf({ ...transformed, encoders: next.encoders }, encoder);
}
