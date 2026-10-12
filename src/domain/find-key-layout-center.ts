import type { Project, WirePoint } from './types';

// Keys are currently 1u squares; use outer bounds so uneven key counts do not bias the camera.
export function findKeyLayoutCenter(project: Project): WirePoint | undefined {
  if (project.keys.length === 0) {
    return undefined;
  }
  const xs = project.keys.map((key) => key.xU);
  const ys = project.keys.map((key) => key.yU);
  return {
    xU: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
    yU: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
  };
}
