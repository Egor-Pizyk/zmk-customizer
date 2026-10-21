import { getWireSections } from '@domain/wires';
import { getSchematicGeometry } from './get-schematic-geometry';
import type { DiodePlacement } from './get-schematic-geometry';
import { getKeyPinPosition, getWirePath } from '@domain/wires/geometry';
import { getNearestPointOnPath } from '@domain/geometry';
import type { Key, Project, WirePoint } from '@domain';
import type { CanvasHit } from './read-canvas-hit';
import type { DraftTarget } from './reduce-wire-draft';

function pinTarget(key: Key, world: WirePoint, placement: DiodePlacement | undefined): DraftTarget {
  const candidates = ([1, 2] as const)
    .map((pin) => {
      const physical = getKeyPinPosition(key, pin);
      const point = key.diode?.pin === pin ? (placement?.terminal ?? physical) : physical;
      const distance = Math.min(
        Math.hypot(world.xU - physical.xU, world.yU - physical.yU),
        Math.hypot(world.xU - point.xU, world.yU - point.yU),
      );
      return { pin, point, distance };
    })
    .toSorted((first, second) => first.distance - second.distance);
  const nearest = candidates[0];
  if (nearest === undefined) {
    throw new Error('A switch has no pins');
  }
  return { kind: 'key-pin', keyId: key.id, pin: nearest.pin, point: nearest.point };
}

// Pins snap to the pin itself, wires to their nearest path point, anything else to the grid.
export function toDraftTarget(
  project: Project,
  input: { readonly hit: CanvasHit; readonly world: WirePoint; readonly snapped: WirePoint },
): DraftTarget {
  const { world, snapped } = input;
  const sectionId = input.hit.kind === 'section' ? input.hit.sectionId : undefined;
  const section = getWireSections(project).find((entry) => entry.id === sectionId);
  const hit = section === undefined ? input.hit : { kind: 'wire' as const, wireId: section.wireId };
  const geometry = getSchematicGeometry(project);
  if (hit.kind === 'pin') {
    const key = project.keys.find((candidate) => candidate.id === hit.keyId);
    if (key !== undefined) {
      return pinTarget(key, world, geometry.diodes.get(key.id));
    }
  }
  if (hit.kind === 'wire' || hit.kind === 'bend' || hit.kind === 'wire-end') {
    const wire = project.wires.find((candidate) => candidate.id === hit.wireId);
    const point =
      wire === undefined
        ? undefined
        : getNearestPointOnPath(section?.path ?? geometry.paths.get(wire.id) ?? [], world);
    if (wire !== undefined && point !== undefined) {
      const attachmentPoint =
        section === undefined
          ? (getNearestPointOnPath(getWirePath(project, wire), point) ?? point)
          : point;
      return { kind: 'wire', wireId: wire.id, point, attachmentPoint };
    }
  }
  return { kind: 'empty', point: snapped };
}
