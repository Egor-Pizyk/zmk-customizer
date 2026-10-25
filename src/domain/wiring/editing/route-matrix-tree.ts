import { createEntityId } from '@domain/project';
import type { KeyPin, Wire, WireEnd, WirePoint } from '@domain';
import { findMatrixRoute } from './find-matrix-route';
import type { RouteArea, RoutePin, RouteSegment } from './get-route-path-cost';

export type MatrixContact = {
  readonly keyId: string;
  readonly pin: KeyPin;
  readonly at: WirePoint;
};
type TreeNode = { readonly id: string; readonly at: WirePoint; readonly end: WireEnd };
type TreeContext = {
  readonly terminalId: string;
  readonly output: WirePoint;
  readonly up: boolean;
  readonly wires: Wire[];
  readonly pins: readonly RoutePin[];
  readonly areas: readonly RouteArea[];
  readonly segments: RouteSegment[];
  readonly labels: Map<string, string>;
};

export function routeMatrixTree(
  contacts: readonly MatrixContact[],
  context: TreeContext,
): string | undefined {
  const remaining = [...contacts];
  const nodes: TreeNode[] = [
    {
      id: context.terminalId,
      at: context.output,
      end: { kind: 'free', at: context.output, terminalId: context.terminalId },
    },
  ];
  while (remaining.length > 0) {
    const branch = findBranch(remaining, nodes, context);
    if (branch === undefined) {
      return `Cannot connect ${remaining[0]?.keyId ?? 'key'} safely. Separate overlapping contacts or move the key, then rebuild.`;
    }
    const id = createEntityId({ prefix: 'w', existingIds: context.wires.map((wire) => wire.id) });
    const { contact, node, path } = branch;
    const end: WireEnd = { kind: 'key-pin', keyId: contact.keyId, pin: contact.pin };
    context.wires.push({ id, start: end, end: node.end, bends: path.slice(1, -1) });
    context.labels.set(id, context.terminalId);
    appendSegments(path, context);
    if (nodes[0]?.id === context.terminalId) {
      nodes.splice(0, 1);
    }
    nodes.push({ id: `${contact.keyId}:${contact.pin}`, at: contact.at, end });
    remaining.splice(remaining.indexOf(contact), 1);
  }
  return undefined;
}

function findBranch(
  contacts: readonly MatrixContact[],
  nodes: readonly TreeNode[],
  context: TreeContext,
):
  | {
      readonly contact: MatrixContact;
      readonly node: TreeNode;
      readonly path: readonly WirePoint[];
    }
  | undefined {
  const pairs = contacts
    .flatMap((contact) =>
      nodes.map((node) => ({
        contact,
        node,
        distance: Math.abs(contact.at.xU - node.at.xU) + Math.abs(contact.at.yU - node.at.yU),
      })),
    )
    .toSorted((first, second) => first.distance - second.distance);
  for (const { contact, node } of pairs) {
    const path = findMatrixRoute(contact.at, node.at, {
      pins: context.pins,
      areas: context.areas,
      segments: context.segments,
      net: context.terminalId,
      up: context.up && node.id === context.terminalId,
      allowedPins: [`${contact.keyId}:${contact.pin}`, node.id],
    });
    if (path !== undefined) {
      return { contact, node, path };
    }
  }
  return undefined;
}

function appendSegments(path: readonly WirePoint[], context: TreeContext) {
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    if (start !== undefined && end !== undefined) {
      context.segments.push({ start, end, net: context.terminalId });
    }
  }
}
