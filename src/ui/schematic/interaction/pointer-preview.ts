import { moveKeys, moveKey } from '@domain/keys';
import { setWireBends } from '@domain/wires/editing';
import type { Project } from '@domain';
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
    return moveKeys(project, {
      moves: drag.keyStarts.map((ks) => ({
        keyId: ks.keyId,
        position: { xU: ks.start.xU + dx, yU: ks.start.yU + dy },
      })),
    });
  }
  if (drag?.kind === 'bend') {
    const wire = project.wires.find((candidate) => candidate.id === drag.wireId);
    const bends = wire?.bends.with(drag.bendIndex, drag.point) ?? [];
    return setWireBends(project, { wireId: drag.wireId, bends });
  }
  return project;
}
