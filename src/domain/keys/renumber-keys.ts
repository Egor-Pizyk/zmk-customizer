import { getKeyCenter } from '../geometry/get-key-center';
import { roundU } from '../geometry/round-u';
import type { Project } from '../types';

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
