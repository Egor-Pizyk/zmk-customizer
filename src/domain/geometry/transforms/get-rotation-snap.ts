import { roundU } from '@domain/geometry';

export type RotationSnap = {
  readonly angleDeg: number;
  readonly timeMs: number;
  readonly rotationDeg: number;
  readonly targetDeg?: number;
};

function wrapAngle(angle: number): number {
  return roundU(((((angle + 180) % 360) + 360) % 360) - 180);
}

function findTarget(input: {
  readonly angleDeg: number;
  readonly timeMs: number;
  readonly previous: RotationSnap | undefined;
}): number | undefined {
  const { angleDeg, timeMs, previous } = input;
  if (previous === undefined || timeMs <= previous.timeMs) {
    return undefined;
  }
  const speedDegPerSecond =
    (Math.abs(wrapAngle(angleDeg - previous.angleDeg)) * 1000) / (timeMs - previous.timeMs);
  if (speedDegPerSecond > 45) {
    return undefined;
  }
  return [0, 90, 120, -180].find((target) => Math.abs(wrapAngle(angleDeg - target)) <= 4);
}

export function getRotationSnap(input: {
  readonly angleDeg: number;
  readonly timeMs: number;
  readonly previous: RotationSnap | undefined;
  readonly isEnabled: boolean;
  readonly isShiftPressed: boolean;
}): RotationSnap {
  const angleDeg = wrapAngle(input.angleDeg);
  const sample = { angleDeg, timeMs: input.timeMs, rotationDeg: angleDeg };
  if (input.isShiftPressed) {
    return { ...sample, rotationDeg: wrapAngle(Math.round(angleDeg / 15) * 15) };
  }
  if (!input.isEnabled) {
    return sample;
  }
  const held = input.previous?.targetDeg;
  if (held !== undefined) {
    return Math.abs(wrapAngle(angleDeg - held)) <= 7
      ? { ...sample, rotationDeg: held, targetDeg: held }
      : sample;
  }
  const targetDeg = findTarget({ ...input, angleDeg });
  return targetDeg === undefined ? sample : { ...sample, rotationDeg: targetDeg, targetDeg };
}
