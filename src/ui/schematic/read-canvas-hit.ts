import type { KeyPin, WireEndSide } from '../../domain/types';

export type CanvasHit =
  | { readonly kind: 'pin'; readonly keyId: string; readonly pin: KeyPin }
  | { readonly kind: 'bend'; readonly wireId: string; readonly bendIndex: number }
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
  if (target.closest('button') !== null) {
    return { kind: 'control' };
  }
  const pin = closestData(target, 'pin');
  if (pin?.['keyId'] !== undefined) {
    return { kind: 'pin', keyId: pin['keyId'], pin: pin['pin'] === '2' ? 2 : 1 };
  }
  const bend = closestData(target, 'bend-index');
  if (bend?.['wireId'] !== undefined) {
    return { kind: 'bend', wireId: bend['wireId'], bendIndex: Number(bend['bendIndex']) };
  }
  const end = closestData(target, 'wire-end');
  if (end?.['wireId'] !== undefined) {
    return {
      kind: 'wire-end',
      wireId: end['wireId'],
      side: end['wireEnd'] === 'start' ? 'start' : 'end',
    };
  }
  const wire = closestData(target, 'wire-id');
  if (wire?.['wireId'] !== undefined) {
    return { kind: 'wire', wireId: wire['wireId'] };
  }
  const key = closestData(target, 'key-id');
  return key?.['keyId'] === undefined ? { kind: 'empty' } : { kind: 'key', keyId: key['keyId'] };
}
