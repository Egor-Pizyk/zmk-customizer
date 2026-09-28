import { moveKey } from '../../domain/move-key';
import { setWireBends } from '../../domain/set-wire-bends';
import type { Project } from '../../domain/types';
import type { Drag } from './pointer-types';

// Derived in render from the drag state; nothing is committed until pointer-up.
export function getPreviewProject(project: Project, drag: Drag | undefined): Project {
  if (drag?.kind === 'key') {
    return moveKey(project, { keyId: drag.keyId, position: drag.position });
  }
  if (drag?.kind === 'multi-key') {
    const first = drag.keyStarts[0];
    if (first === undefined) {
      return project;
    }
    const dx = drag.position.xU - first.start.xU;
    const dy = drag.position.yU - first.start.yU;
    let next = project;
    for (const ks of drag.keyStarts) {
      next = moveKey(next, {
        keyId: ks.keyId,
        position: { xU: ks.start.xU + dx, yU: ks.start.yU + dy },
      });
    }
    return next;
  }
  if (drag?.kind === 'bend') {
    const wire = project.wires.find((candidate) => candidate.id === drag.wireId);
    const bends = wire?.bends.with(drag.bendIndex, drag.point) ?? [];
    return setWireBends(project, { wireId: drag.wireId, bends });
  }
  return project;
}
