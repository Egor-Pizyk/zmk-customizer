import { getKeyCenter } from './get-key-center';
import { getKeyGeometry } from './get-key-geometry';
import { roundU } from './round-u';
import { setKeyGeometries } from '../keys/set-key-geometries';
import type { Project, WirePoint } from '../types';

export type RotateKeyInput = {
  readonly keyId: string;
  readonly start: WirePoint;
  readonly position: WirePoint;
  readonly isAngleSnapEnabled?: boolean;
};

function wrapAngle(angle: number) {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

export function rotateKeyFromPointer(project: Project, input: RotateKeyInput): Project {
  const key = project.keys.find((candidate) => candidate.id === input.keyId);
  if (
    key === undefined ||
    (input.start.xU === input.position.xU && input.start.yU === input.position.yU)
  ) {
    return project;
  }
  const geometry = getKeyGeometry(key);
  const center = getKeyCenter(key);
  if (
    Math.hypot(input.position.xU - center.xU, input.position.yU - center.yU) < 1e-8 ||
    Math.hypot(input.start.xU - center.xU, input.start.yU - center.yU) < 1e-8
  ) {
    return project;
  }
  const from = Math.atan2(input.start.yU - center.yU, input.start.xU - center.xU);
  const to = Math.atan2(input.position.yU - center.yU, input.position.xU - center.xU);
  const angle = geometry.rotationDeg + wrapAngle(((to - from) * 180) / Math.PI);
  const rotationDeg = roundU(
    wrapAngle(input.isAngleSnapEnabled === true ? Math.round(angle / 15) * 15 : angle),
  );
  if (Math.abs(wrapAngle(rotationDeg - geometry.rotationDeg)) < 0.0001) {
    return project;
  }
  return setKeyGeometries(project, {
    changes: [
      {
        keyId: key.id,
        geometry: {
          xU: center.xU - geometry.widthU / 2,
          yU: center.yU - geometry.heightU / 2,
          rotationDeg,
          rotationOriginXU: center.xU,
          rotationOriginYU: center.yU,
        },
      },
    ],
  });
}
