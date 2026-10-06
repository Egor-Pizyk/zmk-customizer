import type { Project, WirePoint } from './types';

// Every key occupies a 1u × 1u cell from its top-left corner; touching edges is allowed.
export function isKeyPositionFree(
  project: Project,
  input: {
    readonly position: WirePoint;
    readonly ignoreKeyId?: string;
    readonly ignoreKeyIds?: readonly string[];
  },
): boolean {
  return project.keys.every(
    (key) =>
      key.id === input.ignoreKeyId ||
      input.ignoreKeyIds?.includes(key.id) === true ||
      Math.abs(key.xU - input.position.xU) >= 1 ||
      Math.abs(key.yU - input.position.yU) >= 1,
  );
}
