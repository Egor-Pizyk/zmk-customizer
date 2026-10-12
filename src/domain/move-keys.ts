import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import type { Project, WirePoint } from './types';

export function moveKeys(
  project: Project,
  input: { readonly moves: readonly { readonly keyId: string; readonly position: WirePoint }[] },
): Project {
  const positionByKeyId = new Map(input.moves.map((move) => [move.keyId, move.position]));
  const keys = project.keys.map((key) => {
    const position = positionByKeyId.get(key.id);
    return position === undefined || (key.xU === position.xU && key.yU === position.yU)
      ? key
      : { ...key, xU: position.xU, yU: position.yU };
  });
  return keys.every((key, index) => key === project.keys[index])
    ? project
    : pruneInsulatedCrossings({ ...project, keys });
}
