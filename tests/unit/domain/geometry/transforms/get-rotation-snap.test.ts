import { expect, it } from 'vitest';
import { getRotationSnap } from '@domain/geometry/transforms';
import type { RotationSnap } from '@domain/geometry/transforms';

function sample(
  angleDeg: number,
  options: {
    readonly timeMs?: number;
    readonly previous?: RotationSnap;
    readonly isEnabled?: boolean;
    readonly isShiftPressed?: boolean;
  } = {},
) {
  return getRotationSnap({
    angleDeg,
    timeMs: options.timeMs ?? 1000,
    previous: options.previous,
    isEnabled: options.isEnabled ?? true,
    isShiftPressed: options.isShiftPressed ?? false,
  });
}

it.each([
  [0, 0, 8],
  [90, 90, 98],
  [120, 120, 128],
  [180, -180, -172],
])(
  'captures a slow approach to %s, holds and releases with hysteresis',
  (target, expected, releasedAngle) => {
    const previous = sample(target - 5, { timeMs: 900 });
    const captured = sample(target - 3, { previous });
    expect(captured.rotationDeg).toBe(expected);
    expect(captured.targetDeg).toBe(expected);
    const held = sample(target + 6, { previous: captured, timeMs: 1010 });
    expect(held.rotationDeg).toBe(expected);
    expect(sample(target + 7, { previous: held, timeMs: 1015 }).rotationDeg).toBe(expected);
    const released = sample(target + 8, { previous: held, timeMs: 1020 });
    expect(released.targetDeg).toBeUndefined();
    expect(released.rotationDeg).toBe(releasedAngle);
  },
);
it('does not capture fast motion, missing samples, or nonpositive elapsed time', () => {
  const previous = sample(85, { timeMs: 990 });
  expect(sample(88, { previous }).rotationDeg).toBe(88);
  expect(sample(88).targetDeg).toBeUndefined();
  expect(sample(88, { previous, timeMs: 990 }).targetDeg).toBeUndefined();
  expect(sample(88, { previous, timeMs: 980 }).targetDeg).toBeUndefined();
});
it('captures at the inclusive speed and angle limits but not beyond them', () => {
  expect(sample(86, { previous: sample(81.5, { timeMs: 900 }) }).rotationDeg).toBe(90);
  expect(sample(85.9, { previous: sample(84, { timeMs: 900 }) }).rotationDeg).toBe(85.9);
  expect(sample(86, { previous: sample(81.4, { timeMs: 900 }) }).rotationDeg).toBe(86);
});
it('wraps across 180 and 360 without mistaking a short move for high speed', () => {
  expect(sample(-179, { previous: sample(179, { timeMs: 900 }) }).rotationDeg).toBe(-180);
  expect(sample(359, { previous: sample(357, { timeMs: 900 }) }).rotationDeg).toBe(0);
  expect(sample(-89, { previous: sample(-91, { timeMs: 900 }) }).rotationDeg).toBe(-89);
});
it('Snap off clears a held target; Shift takes 15-degree priority and clears capture', () => {
  const held = sample(88, { previous: sample(85, { timeMs: 900 }) });
  expect(sample(92, { previous: held, isEnabled: false }).rotationDeg).toBe(92);
  const shifted = sample(118, { previous: held, isShiftPressed: true, isEnabled: false });
  expect(shifted.rotationDeg).toBe(120);
  expect(shifted.targetDeg).toBeUndefined();
});
