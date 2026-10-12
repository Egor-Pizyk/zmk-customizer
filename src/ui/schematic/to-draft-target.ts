import { getSchematicGeometry } from './get-schematic-geometry';
import type { DiodePlacement } from './get-schematic-geometry';
import { getKeyPinPosition } from '../../domain/get-key-pin-position';
import { getNearestPointOnPath } from '../../domain/get-nearest-point-on-path';
import { getWirePath } from '../../domain/get-wire-path';
import type { Key, Project, WirePoint } from '../../domain/types';
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
  const { hit, world, snapped } = input;
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
        : getNearestPointOnPath(geometry.paths.get(wire.id) ?? [], world);
    if (wire !== undefined && point !== undefined) {
      const attachmentPoint = getNearestPointOnPath(getWirePath(project, wire), point) ?? point;
      return { kind: 'wire', wireId: wire.id, point, attachmentPoint };
    }
  }
  return { kind: 'empty', point: snapped };
}
