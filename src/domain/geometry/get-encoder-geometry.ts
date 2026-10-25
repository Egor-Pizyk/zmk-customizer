import type { Encoder, Project, WirePoint } from '@domain';
import { getKeyCenter } from './get-key-center';
import { rotatePoint } from './rotate-point';

/** A linked ordinary key owns geometry, so key edits cannot detach the encoder body. */
export function getEncoderGeometry(project: Pick<Project, 'keys'>, encoder: Encoder) {
  const key = project.keys.find((entry) => entry.id === encoder.pushKeyId);
  if (key === undefined) {
    return { xU: encoder.xU, yU: encoder.yU, rotationDeg: encoder.rotationDeg ?? 0 };
  }
  const center = getKeyCenter(key);
  return { xU: center.xU - 0.5, yU: center.yU - 0.5, rotationDeg: key.rotationDeg ?? 0 };
}

export function getEncoderPinPosition(
  project: Pick<Project, 'keys'>,
  encoder: Encoder,
  pin: 'A' | 'COM' | 'B',
): WirePoint {
  const geometry = getEncoderGeometry(project, encoder);
  const offset = { A: 0.15, B: 0.85, COM: 0.5 };
  return rotatePoint(
    { xU: geometry.xU + offset[pin], yU: geometry.yU - 0.15 },
    { rotationDeg: geometry.rotationDeg, origin: { xU: geometry.xU + 0.5, yU: geometry.yU + 0.5 } },
  );
}
