import { findFreeEndPosition } from '../../domain/find-free-end-position';
import { getKeyPinPosition } from '../../domain/get-key-pin-position';
import { getNearestPointOnPath } from '../../domain/get-nearest-point-on-path';
import { getWirePath } from '../../domain/get-wire-path';
import type { KeyPin, Project, WireEnd } from '../../domain/types';

export const FREE_END_VALUE = 'free';

type StartPin = { readonly keyId: string; readonly pin: KeyPin };

export function listPinOptions(project: Project) {
  return project.keys.flatMap((key, keyIndex) =>
    ([1, 2] as const).map((pin) => ({
      value: `pin:${key.id}:${pin}`,
      label: `Key ${keyIndex} pin ${pin}`,
    })),
  );
}

export function toStartPin(value: string): StartPin | undefined {
  const [kind, keyId, pin] = value.split(':');
  return kind === 'pin' && keyId !== undefined ? { keyId, pin: pin === '2' ? 2 : 1 } : undefined;
}

// FR-008 from the keyboard: to a key pin, onto another wire (junction nearest the start pin) or
// to a free end placed below the start pin (003 U3).
export function toTargetEnd(
  project: Project,
  input: { readonly value: string; readonly start: StartPin },
): WireEnd {
  const key = project.keys.find((candidate) => candidate.id === input.start.keyId);
  const startPoint = key === undefined ? { xU: 0, yU: 0 } : getKeyPinPosition(key, input.start.pin);
  const keyPin = toStartPin(input.value);
  if (keyPin !== undefined) {
    return { kind: 'key-pin', ...keyPin };
  }
  const wire = project.wires.find((candidate) => `wire:${candidate.id}` === input.value);
  if (wire !== undefined) {
    const at = getNearestPointOnPath(getWirePath(project, wire), startPoint) ?? startPoint;
    return { kind: 'junction', wireId: wire.id, at };
  }
  return { kind: 'free', at: findFreeEndPosition(project, { start: startPoint }) };
}
