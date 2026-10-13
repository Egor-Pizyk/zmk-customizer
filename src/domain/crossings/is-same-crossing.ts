import type { CrossingRef } from '../types';

export function isSameCrossing(first: CrossingRef, second: CrossingRef): boolean {
  return (
    first.ordinal === second.ordinal &&
    first.wireIds[0] === second.wireIds[0] &&
    first.wireIds[1] === second.wireIds[1]
  );
}
