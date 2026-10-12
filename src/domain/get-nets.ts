import type { WireContacts } from './find-wire-contacts';
import { findWireContacts } from './find-wire-contacts';
import { getKeyPinWires } from './get-key-pin-wires';
import { isSameCrossing } from './is-same-crossing';
import type { KeyPin, Project, WireEndSide } from './types';

export type NetBoardPin = {
  readonly wireId: string;
  readonly side: WireEndSide;
  readonly boardPin: number;
};

export type Net = {
  readonly pins: readonly { readonly keyId: string; readonly pin: KeyPin }[];
  readonly wireIds: readonly string[];
  readonly boardPins: readonly NetBoardPin[];
};

const KEY_PINS: readonly KeyPin[] = [1, 2];
const SIDES: readonly WireEndSide[] = ['start', 'end'];

function createUnionFind() {
  const parentByNode = new Map<string, string>();
  function find(node: string): string {
    const parent = parentByNode.get(node) ?? node;
    if (parent === node) {
      return node;
    }
    const root = find(parent);
    parentByNode.set(node, root);
    return root;
  }
  return {
    find,
    union: (first: string, second: string) => {
      parentByNode.set(find(first), find(second));
    },
  };
}

function joinProject(
  project: Project,
  union: (first: string, second: string) => void,
  contacts: WireContacts,
) {
  const wiresOf = getKeyPinWires(project);
  for (const key of project.keys) {
    for (const pin of KEY_PINS) {
      for (const wireIndex of wiresOf({ keyId: key.id, pin })) {
        union(`wire:${project.wires[wireIndex]?.id ?? ''}`, `pin:${key.id}:${pin}`);
      }
    }
  }
  for (const wire of project.wires) {
    for (const side of SIDES) {
      const end = wire[side];
      if (end.kind === 'junction') {
        union(`wire:${wire.id}`, `wire:${end.wireId}`);
      }
    }
  }
  // One O(n²) contact pass for both joins (003 R12).
  const { overlaps, crossings } = contacts;
  for (const [first, second] of overlaps) {
    union(`wire:${first}`, `wire:${second}`);
  }
  for (const crossing of crossings) {
    const isInsulated = project.insulatedCrossings.some((stored) =>
      isSameCrossing(stored, crossing),
    );
    if (!isInsulated) {
      union(`wire:${crossing.wireIds[0]}`, `wire:${crossing.wireIds[1]}`);
    }
  }
}

type MutableNet = { pins: Net['pins'][number][]; wireIds: string[]; boardPins: NetBoardPin[] };

// Derived, never stored (003 R7). Every key pin is in exactly one net, even when unconnected;
// nets are ordered by their first key pin, then first wire, in project order.
export function getNets(
  project: Project,
  contacts: WireContacts = findWireContacts(project),
): readonly Net[] {
  const { find, union } = createUnionFind();
  joinProject(project, union, contacts);
  const netByRoot = new Map<string, MutableNet>();
  function netOf(node: string): MutableNet {
    const root = find(node);
    const existing = netByRoot.get(root);
    if (existing !== undefined) {
      return existing;
    }
    const created: MutableNet = { pins: [], wireIds: [], boardPins: [] };
    netByRoot.set(root, created);
    return created;
  }
  for (const key of project.keys) {
    for (const pin of KEY_PINS) {
      netOf(`pin:${key.id}:${pin}`).pins.push({ keyId: key.id, pin });
    }
  }
  for (const wire of project.wires) {
    const net = netOf(`wire:${wire.id}`);
    net.wireIds.push(wire.id);
    for (const side of SIDES) {
      const end = wire[side];
      if (end.kind === 'free' && end.boardPin !== undefined) {
        net.boardPins.push({ wireId: wire.id, side, boardPin: end.boardPin });
      }
    }
  }
  return [...netByRoot.values()];
}
