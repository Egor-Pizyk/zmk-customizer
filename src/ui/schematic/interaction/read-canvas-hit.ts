import type { KeyPin, WireEndSide } from '@domain';

export type CanvasHit =
  | { readonly kind: 'encoder'; readonly encoderId: string; readonly rotate: boolean }
  | { readonly kind: 'encoder-pin'; readonly encoderId: string; readonly pin: 'A' | 'COM' | 'B' }
  | { readonly kind: 'section'; readonly sectionId: string; readonly wireId: string }
  | { readonly kind: 'pin'; readonly keyId: string; readonly pin: KeyPin }
  | {
      readonly kind: 'bend';
      readonly wireId: string;
      readonly bendIndex?: number;
      readonly point: { readonly xU: number; readonly yU: number };
    }
  | { readonly kind: 'wire-end'; readonly wireId: string; readonly side: WireEndSide }
  | { readonly kind: 'wire'; readonly wireId: string }
  | { readonly kind: 'key'; readonly keyId: string }
  | { readonly kind: 'control' }
  | { readonly kind: 'empty' };

function closestData(target: Element, attribute: string): DOMStringMap | undefined {
  const element = target.closest(`[data-${attribute}]`);
  return element instanceof SVGElement ? element.dataset : undefined;
}

// Hit priority follows the layers: pins above wire ends, bends and wires, keys at the bottom.
export function readCanvasHit(target: EventTarget | null): CanvasHit {
  if (!(target instanceof Element)) {
    return { kind: 'empty' };
  }
  const encoderHit = readEncoderHit(target);
  if (encoderHit !== null) {
    return encoderHit;
  }
  if (target.closest('button') !== null) {
    return { kind: 'control' };
  }
  const pin = closestData(target, 'pin');
  if (pin?.['keyId'] !== undefined) {
    return { kind: 'pin', keyId: pin['keyId'], pin: pin['pin'] === '2' ? 2 : 1 };
  }
  const bendHit = readBendHit(target);
  if (bendHit !== null) {
    return bendHit;
  }
  const end = closestData(target, 'wire-end');
  if (end?.['wireId'] !== undefined) {
    return {
      kind: 'wire-end',
      wireId: end['wireId'],
      side: end['wireEnd'] === 'start' ? 'start' : 'end',
    };
  }
  const section = closestData(target, 'section-id');
  if (section?.['sectionId'] !== undefined && section['wireId'] !== undefined) {
    return { kind: 'section', sectionId: section['sectionId'], wireId: section['wireId'] };
  }
  const wire = closestData(target, 'wire-id');
  if (wire?.['wireId'] !== undefined) {
    return { kind: 'wire', wireId: wire['wireId'] };
  }
  const key = closestData(target, 'key-id');
  return key?.['keyId'] === undefined ? { kind: 'empty' } : { kind: 'key', keyId: key['keyId'] };
}

function readBendHit(target: Element): CanvasHit | null {
  const bend = closestData(target, 'wire-bend');
  if (
    bend?.['wireId'] !== undefined &&
    bend['bendXU'] !== undefined &&
    bend['bendYU'] !== undefined
  ) {
    const bendIndex = bend['bendIndex'];
    return {
      kind: 'bend',
      wireId: bend['wireId'],
      ...(bendIndex === undefined ? {} : { bendIndex: Number(bendIndex) }),
      point: { xU: Number(bend['bendXU']), yU: Number(bend['bendYU']) },
    };
  }
  return null;
}

function readEncoderHit(target: Element): CanvasHit | null {
  const encoderPin = closestData(target, 'encoder-pin');
  if (
    encoderPin?.['encoderId'] !== undefined &&
    (encoderPin['encoderPin'] === 'A' ||
      encoderPin['encoderPin'] === 'COM' ||
      encoderPin['encoderPin'] === 'B')
  ) {
    return {
      kind: 'encoder-pin',
      encoderId: encoderPin['encoderId'],
      pin: encoderPin['encoderPin'],
    };
  }
  const rotation = closestData(target, 'encoder-rotate');
  if (rotation?.['encoderRotate'] !== undefined) {
    return { kind: 'encoder', encoderId: rotation['encoderRotate'], rotate: true };
  }
  const encoder = closestData(target, 'encoder-id');
  if (encoder?.['encoderId'] !== undefined) {
    return { kind: 'encoder', encoderId: encoder['encoderId'], rotate: false };
  }
  return null;
}
