import { isKeyPositionFree } from './is-key-position-free';
import type { Project, WirePoint } from '../types';

// Keyboard placement (Enter, "Add key"): the first free cell right of the last key, same row.
export function findFreeKeyPosition(project: Project): WirePoint {
  const lastKey = project.keys.at(-1);
  if (lastKey === undefined) {
    return { xU: 0, yU: 0 };
  }
  let position = { xU: lastKey.xU + 1, yU: lastKey.yU };
  while (!isKeyPositionFree(project, { position })) {
    position = { xU: position.xU + 1, yU: position.yU };
  }
  return position;
}
