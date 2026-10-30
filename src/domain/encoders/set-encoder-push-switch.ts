import { getWireProtection } from '@domain/wires/protection';
import { PROJECT_BUDGET } from '@domain/project';
import type { Encoder, Project } from '@domain';
import { getEncoderGeometry } from '@domain/geometry';
import { addKey, removeKey } from '@domain/keys';

function removePushKey(project: Project, encoder: Encoder): Project {
  const geometry = getEncoderGeometry(project, encoder);
  const withoutKey =
    encoder.pushKeyId === undefined ? project : removeKey(project, { keyId: encoder.pushKeyId });
  const { pushKeyId: _removed, ...rest } = encoder;
  const nextEncoder = { ...rest, ...geometry };
  return {
    ...withoutKey,
    encoders: withoutKey.encoders.map((entry) => (entry.id === encoder.id ? nextEncoder : entry)),
  };
}

export function setEncoderPushSwitch(
  project: Project,
  input: { readonly encoderId: string; readonly enabled: boolean },
): Project {
  const encoder = project.encoders.find((entry) => entry.id === input.encoderId);
  if (encoder === undefined || input.enabled === (encoder.pushKeyId !== undefined)) {
    return project;
  }
  if (!input.enabled) {
    return encoder.pushKeyId !== undefined &&
      getWireProtection(project, { keyIds: [encoder.pushKeyId] }).length > 0
      ? project
      : removePushKey(project, encoder);
  }
  if (project.keys.length >= PROJECT_BUDGET.keys) {
    return project;
  }
  const geometry = getEncoderGeometry(project, encoder);
  const added = addKey(project, { position: geometry, maxKeyCount: PROJECT_BUDGET.keys });
  const key = added.keys.at(-1);
  if (key === undefined) {
    return project;
  }
  const nextKey = {
    ...key,
    half: encoder.half,
    rotationDeg: geometry.rotationDeg,
    rotationOriginXU: geometry.xU + 0.5,
    rotationOriginYU: geometry.yU + 0.5,
  };
  const nextEncoder = { ...encoder, pushKeyId: key.id };
  return {
    ...added,
    keys: added.keys.map((entry) => (entry.id === key.id ? nextKey : entry)),
    encoders: added.encoders.map((entry) => (entry.id === encoder.id ? nextEncoder : entry)),
  };
}
