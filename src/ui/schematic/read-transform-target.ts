import type { KeyPointerTransform } from '../../domain/transform-key-from-pointer';
import type { WirePoint } from '../../domain/types';
import { TRANSFORM_HANDLES } from './transform-handles';

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
  const handle = TRANSFORM_HANDLES.find(
    (candidate) => candidate.name === button?.dataset['transformHandle'],
  );
  return handle === undefined
    ? undefined
    : { kind: 'resize', keyId, direction: { x: handle.x, y: handle.y }, start, position: start };
}
