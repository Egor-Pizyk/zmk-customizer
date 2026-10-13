import { getKeyGeometry } from './get-key-geometry';
import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import type { Project, WirePoint } from './types';

export function moveKeys(
  project: Project,
  input: { readonly moves: readonly { readonly keyId: string; readonly position: WirePoint }[] },
): Project {
  const positionByKeyId = new Map(input.moves.map((move) => [move.keyId, move.position]));
  const keys = project.keys.map((key) => {
    const position = positionByKeyId.get(key.id);
    if (position === undefined || (key.xU === position.xU && key.yU === position.yU)) {
      return key;
    }
    const geometry = getKeyGeometry(key);
    const origin =
      geometry.rotationDeg !== 0 ||
      key.rotationOriginXU !== undefined ||
      key.rotationOriginYU !== undefined
        ? {
            rotationOriginXU: geometry.rotationOriginXU + position.xU - key.xU,
            rotationOriginYU: geometry.rotationOriginYU + position.yU - key.yU,
          }
        : {};
    return { ...key, ...position, ...origin };
  });
  return keys.every((key, index) => key === project.keys[index])
    ? project
    : pruneInsulatedCrossings({ ...project, keys });
}
