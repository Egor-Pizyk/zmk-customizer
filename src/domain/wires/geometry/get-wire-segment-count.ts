import type { Project } from '@domain';
import { getWireConductors } from './get-wire-conductors';

export function getWireSegmentCount(
  project: Pick<Project, 'keys' | 'wires' | 'wireContacts'>,
): number {
  let count = 0;
  for (const wire of project.wires) {
    if (
      wire.anchors === undefined &&
      wire.contacts === undefined &&
      wire.contactIds === undefined
    ) {
      count += 2 * (wire.bends.length + 1);
      continue;
    }
    const paths = getWireConductors(project, wire);
    count += Math.max(2 * (wire.bends.length + 1), (paths[0]?.length ?? 1) - 1);
    for (const path of paths.slice(1)) {
      count += path.slice(1).filter((point, index) => {
        const previous = path[index];
        return point.xU !== previous?.xU || point.yU !== previous.yU;
      }).length;
    }
  }
  return count;
}
