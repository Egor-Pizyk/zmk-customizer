import type { Key, Project, Wire, WireEnd } from '../../src/domain/types';

// Test-only builders; not imported by app code.
export function buildProject(input: {
  readonly keys?: readonly Key[];
  readonly wires?: readonly Wire[];
  readonly insulatedCrossings?: Project['insulatedCrossings'];
}): Project {
  return {
    schemaVersion: 2,
    name: 'Test',
    keys: input.keys ?? [],
    wires: input.wires ?? [],
    insulatedCrossings: input.insulatedCrossings ?? [],
  };
}

export function keyPin(keyId: string, pin: 1 | 2): WireEnd {
  return { kind: 'key-pin', keyId, pin };
}

export function freeEnd(xU: number, yU: number, boardPin?: number): WireEnd {
  return boardPin === undefined
    ? { kind: 'free', at: { xU, yU } }
    : { kind: 'free', at: { xU, yU }, boardPin };
}
