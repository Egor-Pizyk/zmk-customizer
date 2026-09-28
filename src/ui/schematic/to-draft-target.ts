import { findNearestKeyPin } from '../../domain/find-nearest-key-pin';
import { getKeyPinPosition } from '../../domain/get-key-pin-position';
import { getNearestPointOnPath } from '../../domain/get-nearest-point-on-path';
import { getWirePath } from '../../domain/get-wire-path';
import type { Project, WirePoint } from '../../domain/types';
import type { CanvasHit } from './read-canvas-hit';
import type { DraftTarget } from './reduce-wire-draft';

// Pins snap to the pin itself, wires to their nearest path point, anything else to the grid.
export function toDraftTarget(
  project: Project,
  input: { readonly hit: CanvasHit; readonly world: WirePoint; readonly snapped: WirePoint },
): DraftTarget {
  const { hit, world, snapped } = input;
  if (hit.kind === 'pin') {
    const key = project.keys.find((candidate) => candidate.id === hit.keyId);
    if (key !== undefined) {
      // The hit circles of the two pins overlap; the nearer pin wins, not the one drawn on top.
      const pin = findNearestKeyPin(key, world);
      return { kind: 'key-pin', keyId: key.id, pin, point: getKeyPinPosition(key, pin) };
    }
  }
  if (hit.kind === 'wire' || hit.kind === 'bend' || hit.kind === 'wire-end') {
    const wire = project.wires.find((candidate) => candidate.id === hit.wireId);
    const point =
      wire === undefined ? undefined : getNearestPointOnPath(getWirePath(project, wire), world);
    if (wire !== undefined && point !== undefined) {
      return { kind: 'wire', wireId: wire.id, point };
    }
  }
  return { kind: 'empty', point: snapped };
}
