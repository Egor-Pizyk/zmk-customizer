import { getKeyPinPosition } from './get-key-pin-position';
import { getWirePath } from './get-wire-path';
import type { KeyPin, Project, WirePoint } from './types';

const KEY_PINS: readonly KeyPin[] = [1, 2];
const EPSILON_U = 1e-4;

function isOnPath(path: readonly WirePoint[], point: WirePoint): boolean {
  return path.some((from, index) => {
    const to = path[index + 1] ?? from;
    const isInX =
      point.xU >= Math.min(from.xU, to.xU) - EPSILON_U &&
      point.xU <= Math.max(from.xU, to.xU) + EPSILON_U;
    const isInY =
      point.yU >= Math.min(from.yU, to.yU) - EPSILON_U &&
      point.yU <= Math.max(from.yU, to.yU) + EPSILON_U;
    return isInX && isInY;
  });
}

/**
 * Lookup of the wires (by index) connected to each key pin: wires ending on it, and wires whose
 * path runs over it (user request 2026-09-28: a row wire through a pin connects it). Paths are
 * computed once per project.
 */
export function getKeyPinWires(
  project: Project,
): (input: { readonly keyId: string; readonly pin: KeyPin }) => readonly number[] {
  const paths = project.wires.map((wire) => getWirePath(project, wire));
  const wiresByPin = new Map<string, number[]>();
  for (const key of project.keys) {
    for (const pin of KEY_PINS) {
      const position = getKeyPinPosition(key, pin);
      const wireIndices = project.wires.flatMap((wire, wireIndex) => {
        const endsHere = [wire.start, wire.end].some(
          (end) => end.kind === 'key-pin' && end.keyId === key.id && end.pin === pin,
        );
        return endsHere || isOnPath(paths[wireIndex] ?? [], position) ? [wireIndex] : [];
      });
      wiresByPin.set(`${key.id}:${pin}`, wireIndices);
    }
  }
  return (input) => wiresByPin.get(`${input.keyId}:${input.pin}`) ?? [];
}
