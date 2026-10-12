import type { Project, WirePoint } from './types';

// Keys are currently 1u squares; use outer bounds so uneven key counts do not bias the camera.
export function findKeyLayoutCenter(project: Project): WirePoint | undefined {
  if (project.keys.length === 0) {
    return undefined;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const key of project.keys) {
    minX = Math.min(minX, key.xU);
    maxX = Math.max(maxX, key.xU);
    minY = Math.min(minY, key.yU);
    maxY = Math.max(maxY, key.yU);
  }
  return { xU: (minX + maxX + 1) / 2, yU: (minY + maxY + 1) / 2 };
}
