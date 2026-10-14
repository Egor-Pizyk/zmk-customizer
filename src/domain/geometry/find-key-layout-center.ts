import { getKeyCorners } from './get-key-corners';
import type { Project, WirePoint } from '@domain';

// Use visible outer bounds so wide keys and rotated clusters fit the camera.
export function findKeyLayoutCenter(project: Project): WirePoint | undefined {
  if (project.keys.length === 0) {
    return undefined;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of project.keys.flatMap((key) => getKeyCorners(key))) {
    minX = Math.min(minX, point.xU);
    maxX = Math.max(maxX, point.xU);
    minY = Math.min(minY, point.yU);
    maxY = Math.max(maxY, point.yU);
  }
  return { xU: (minX + maxX) / 2, yU: (minY + maxY) / 2 };
}
