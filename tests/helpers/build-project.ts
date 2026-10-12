import type { Key, Project, Wire, WireEnd } from '../../src/domain/types';

// Test-only builders; not imported by app code.
export function buildProject(input: {
  readonly keys?: readonly Key[];
  readonly wires?: readonly Wire[];
  readonly insulatedCrossings?: Project['insulatedCrossings'];
  readonly bindings?: Project['layers'][number]['bindings'];
  /** Replaces the one Base layer built from `bindings`. */
  readonly layers?: Project['layers'];
}): Project {
  return {
    schemaVersion: 3,
    name: 'Test',
    keys: input.keys ?? [],
    wires: input.wires ?? [],
    insulatedCrossings: input.insulatedCrossings ?? [],
    layers: input.layers ?? [{ id: 'l0', name: 'Base', bindings: input.bindings ?? {} }],
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
