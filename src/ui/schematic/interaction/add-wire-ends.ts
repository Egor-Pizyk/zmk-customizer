import { findFreeEndPosition } from '@domain/wires';
import { getKeyPinPosition, getWirePath } from '@domain/wires/geometry';
import { getEncoderPinPosition, getNearestPointOnPath } from '@domain/geometry';
import type { KeyPin, Project, WireEnd } from '@domain';

export const FREE_END_VALUE = 'free';

type StartPin =
  | { readonly keyId: string; readonly pin: KeyPin }
  | { readonly encoderId: string; readonly pin: 'A' | 'COM' | 'B' };

export function listPinOptions(project: Project) {
  return [
    ...project.keys.flatMap((key, keyIndex) =>
      ([1, 2] as const).map((pin) => ({
        value: `pin:${key.id}:${pin}`,
        label: `Key ${keyIndex} pin ${pin}`,
      })),
    ),
    ...project.encoders.flatMap((encoder, index) =>
      encoder.wiringMode === 'schematic'
        ? (['A', 'COM', 'B'] as const).map((pin) => ({
            value: `encoder:${encoder.id}:${pin}`,
            label: `Encoder ${index} ${pin}`,
          }))
        : [],
    ),
  ];
}

export function toStartPin(value: string): StartPin | undefined {
  const [kind, keyId, pin] = value.split(':');
  if (kind === 'encoder' && keyId !== undefined && (pin === 'A' || pin === 'COM' || pin === 'B')) {
    return { encoderId: keyId, pin };
  }
  return kind === 'pin' && keyId !== undefined ? { keyId, pin: pin === '2' ? 2 : 1 } : undefined;
}

// FR-008 from the keyboard: to a key pin, onto another wire (junction nearest the start pin) or
// to a free end placed below the start pin (003 U3).
export function toTargetEnd(
  project: Project,
  input: { readonly value: string; readonly start: StartPin },
): WireEnd {
  const startPoint = getStartPoint(project, input.start);
  const keyPin = toStartPin(input.value);
  if (keyPin !== undefined) {
    return 'encoderId' in keyPin
      ? { kind: 'encoder-pin', ...keyPin }
      : { kind: 'key-pin', ...keyPin };
  }
  const wire = project.wires.find((candidate) => `wire:${candidate.id}` === input.value);
  if (wire !== undefined) {
    const at = getNearestPointOnPath(getWirePath(project, wire), startPoint) ?? startPoint;
    return { kind: 'junction', wireId: wire.id, at };
  }
  return {
    kind: 'free',
    at: findFreeEndPosition(project, { start: freeEndSeed(input.start, startPoint) }),
    ...(input.value === 'ground' ? { ground: true as const } : {}),
  };
}

function getStartPoint(project: Project, start: StartPin) {
  if ('encoderId' in start) {
    const encoder = project.encoders.find((entry) => entry.id === start.encoderId);
    return encoder === undefined
      ? { xU: 0, yU: 0 }
      : getEncoderPinPosition(project, encoder, start.pin);
  }
  const key = project.keys.find((entry) => entry.id === start.keyId);
  return key === undefined ? { xU: 0, yU: 0 } : getKeyPinPosition(key, start.pin);
}

function freeEndSeed(start: StartPin, point: { readonly xU: number; readonly yU: number }) {
  if (!('encoderId' in start)) {
    return point;
  }
  return { xU: point.xU, yU: point.yU - 2 };
}
