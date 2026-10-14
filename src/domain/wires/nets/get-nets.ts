import { findWireContacts, getKeyPinWires } from '@domain/wires';
import type { WireContacts } from '@domain/wires';
import { isSameCrossing } from '@domain/crossings';
import type { KeyPin, Project, Wire, WireEndSide } from '@domain';

export type NetBoardPin = {
  readonly wireId: string;
  readonly side: WireEndSide;
  readonly boardPin: number;
};

export type Net = {
  readonly terminalIds: readonly string[];
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
      if (end.kind === 'free' && end.terminalId !== undefined) {
        union(`wire:${wire.id}`, `terminal:${end.terminalId}`);
      }
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

type MutableNet = {
  terminalIds: string[];
  pins: Net['pins'][number][];
  wireIds: string[];
  boardPins: NetBoardPin[];
};

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
    const created: MutableNet = { terminalIds: [], pins: [], wireIds: [], boardPins: [] };
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
    appendWireEnds(project, wire, net);
  }
  return [...netByRoot.values()];
}

function appendWireEnds(project: Project, wire: Wire, net: MutableNet) {
  for (const side of SIDES) {
    const end = wire[side];
    if (end.kind === 'free') {
      const terminal = project.wiring?.terminals.find((entry) => entry.id === end.terminalId);
      if (end.terminalId !== undefined && !net.terminalIds.includes(end.terminalId)) {
        net.terminalIds.push(end.terminalId);
      }
      const boardPin = terminal?.boardPin ?? end.boardPin;
      if (boardPin !== undefined) {
        net.boardPins.push({ wireId: wire.id, side, boardPin });
      }
    }
  }
}
