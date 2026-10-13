import { getKeyGeometry } from './get-key-geometry';
import { rotatePoint } from './rotate-point';
import { roundU } from './round-u';
import { setKeyGeometries } from './set-key-geometries';
import type { Project, WirePoint } from './types';

export type ResizeDirection = { readonly x: -1 | 0 | 1; readonly y: -1 | 0 | 1 };
export type ResizeKeyInput = {
  readonly keyId: string;
  readonly direction: ResizeDirection;
  readonly start: WirePoint;
  readonly position: WirePoint;
  readonly snapGridU?: number;
};

function getDimension(value: number, snapGridU: number | undefined) {
  return Math.max(
    0.01,
    roundU(snapGridU === undefined ? value : Math.round(value / snapGridU) * snapGridU),
  );
}

export function resizeKeyFromPointer(project: Project, input: ResizeKeyInput): Project {
  const key = project.keys.find((candidate) => candidate.id === input.keyId);
  if (
    key === undefined ||
    (input.start.xU === input.position.xU && input.start.yU === input.position.yU)
  ) {
    return project;
  }
  const geometry = getKeyGeometry(key);
  const delta = rotatePoint(
    { xU: input.position.xU - input.start.xU, yU: input.position.yU - input.start.yU },
    { rotationDeg: -geometry.rotationDeg, origin: { xU: 0, yU: 0 } },
  );
  const widthU =
    input.direction.x === 0
      ? geometry.widthU
      : getDimension(geometry.widthU + delta.xU * input.direction.x, input.snapGridU);
  const heightU =
    input.direction.y === 0
      ? geometry.heightU
      : getDimension(geometry.heightU + delta.yU * input.direction.y, input.snapGridU);
  return setKeyGeometries(project, {
    changes: [
      {
        keyId: key.id,
        geometry: {
          widthU,
          heightU,
          xU: key.xU + (input.direction.x === -1 ? geometry.widthU - widthU : 0),
          yU: key.yU + (input.direction.y === -1 ? geometry.heightU - heightU : 0),
        },
      },
    ],
  });
}
