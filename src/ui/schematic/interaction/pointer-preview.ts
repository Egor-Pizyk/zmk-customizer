import { replaceEncoder } from '@domain/encoders';
import { moveKeys, moveKey } from '@domain/keys';
import { setWireBends } from '@domain/wires/editing';
import type { Project } from '@domain';
import type { Drag } from './pointer-types';
import { getBendDragBends } from './get-bend-drag-bends';

// Derived in render from the drag state; nothing is committed until pointer-up.
export function getPreviewProject(project: Project, drag: Drag | undefined): Project {
  if (drag?.kind === 'encoder') {
    const encoder = project.encoders.find((entry) => entry.id === drag.encoderId);
    if (
      encoder === undefined ||
      (drag.position.xU === drag.bodyStart.xU &&
        drag.position.yU === drag.bodyStart.yU &&
        drag.angle === drag.angleStart)
    ) {
      return project;
    }
    return replaceEncoder(project, { ...encoder, ...drag.position, rotationDeg: drag.angle });
  }
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
    const bends = getBendDragBends(project, drag);
    return setWireBends(project, { wireId: drag.wireId, bends });
  }
  return project;
}
