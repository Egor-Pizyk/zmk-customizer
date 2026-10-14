import { getKeyCenter, roundU } from '@domain/geometry';
import type { Project } from '@domain';

export function renumberKeys(project: Project): Project {
  const keys = project.keys
    .map((key, keyIndex) => ({ key, keyIndex, center: getKeyCenter(key) }))
    .toSorted(
      (first, second) =>
        roundU(first.center.yU) - roundU(second.center.yU) ||
        roundU(first.center.xU) - roundU(second.center.xU) ||
        first.keyIndex - second.keyIndex,
    )
    .map((entry) => entry.key);
  return keys.every((key, index) => key === project.keys[index]) ? project : { ...project, keys };
}
