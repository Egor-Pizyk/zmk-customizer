import { isKeyPositionFree } from '@domain/geometry';
import { resizeKeyFromPointer } from './resize-key-from-pointer';
import type { ResizeKeyInput } from './resize-key-from-pointer';
import { rotateKeyFromPointer } from './rotate-key-from-pointer';
import type { RotateKeyInput } from './rotate-key-from-pointer';
import type { Project } from '@domain';

export type KeyPointerTransform =
  | ({ readonly kind: 'resize' } & ResizeKeyInput)
  | ({ readonly kind: 'rotate' } & RotateKeyInput);

export function transformKeyFromPointer(
  project: Project,
  input: {
    readonly gesture: KeyPointerTransform;
    readonly phase: 'preview' | 'commit';
  },
): Project {
  const { gesture } = input;
  const next =
    gesture.kind === 'resize'
      ? resizeKeyFromPointer(project, gesture)
      : rotateKeyFromPointer(project, gesture);
  const key = next.keys.find((candidate) => candidate.id === gesture.keyId);
  if (
    input.phase === 'commit' &&
    key !== undefined &&
    !isKeyPositionFree(project, { key, position: key, ignoreKeyId: key.id })
  ) {
    return project;
  }
  return next;
}
