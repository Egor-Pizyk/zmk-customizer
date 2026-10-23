import { getKeyCenter, getKeyGeometry, roundU } from '@domain/geometry';
import { getPointerRotationDeg } from './get-pointer-rotation-deg';
import { setKeyGeometries } from '@domain/keys';
import type { Project, WirePoint } from '@domain';

export type RotateKeyInput = {
  readonly keyId: string;
  readonly start: WirePoint;
  readonly position: WirePoint;
  readonly isAngleSnapEnabled?: boolean;
  readonly targetRotationDeg?: number;
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
  const angle = getPointerRotationDeg({
    ...input,
    center,
    initialRotationDeg: geometry.rotationDeg,
  });
  if (angle === undefined) {
    return project;
  }
  const rotationDeg = resolveRotationDeg(input, angle);
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

function resolveRotationDeg(input: RotateKeyInput, angle: number): number {
  const target =
    input.targetRotationDeg ??
    (input.isAngleSnapEnabled === true ? Math.round(angle / 15) * 15 : angle);
  return roundU(wrapAngle(target));
}
