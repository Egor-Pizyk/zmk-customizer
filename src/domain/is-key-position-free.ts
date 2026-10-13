import { doPolygonsOverlap } from './do-polygons-overlap';
import { getKeyCorners } from './get-key-corners';
import { getKeyGeometry } from './get-key-geometry';
import type { Key, Project, WirePoint } from './types';

export function isKeyPositionFree(
  project: Project,
  input: {
    readonly position: WirePoint;
    readonly key?: Key | undefined;
    readonly ignoreKeyId?: string;
    readonly ignoreKeyIds?: readonly string[];
  },
): boolean {
  const source = input.key ?? project.keys.find((key) => key.id === input.ignoreKeyId);
  let candidate: Key = { id: '', ...input.position };
  if (source !== undefined) {
    const geometry = getKeyGeometry(source);
    candidate = {
      ...source,
      ...input.position,
      rotationOriginXU: geometry.rotationOriginXU + input.position.xU - source.xU,
      rotationOriginYU: geometry.rotationOriginYU + input.position.yU - source.yU,
    };
  }
  const corners = getKeyCorners(candidate);
  return project.keys.every(
    (key) =>
      key.id === input.ignoreKeyId ||
      input.ignoreKeyIds?.includes(key.id) === true ||
      !doPolygonsOverlap({ first: corners, second: getKeyCorners(key) }),
  );
}
