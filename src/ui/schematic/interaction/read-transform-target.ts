import type { KeyPointerTransform } from '@domain/geometry/transforms';
import type { WirePoint } from '@domain';

export function readTransformTarget(
  target: EventTarget | null,
  start: WirePoint,
): KeyPointerTransform | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }
  const button = target.closest<HTMLButtonElement>('button[data-key-transform]');
  const keyId = button?.dataset['transformKeyId'];
  if (keyId === undefined) {
    return undefined;
  }
  if (button?.dataset['keyTransform'] === 'rotate') {
    return { kind: 'rotate', keyId, start, position: start };
  }
  return undefined;
}
