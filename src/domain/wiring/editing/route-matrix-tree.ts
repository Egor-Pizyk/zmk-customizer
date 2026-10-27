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
  const first = contacts[0];
  if (first === undefined) {
    return undefined;
  }
  const remaining = contacts.slice(1);
  const nodes: TreeNode[] = [getContactNode(first)];
  while (remaining.length > 0) {
    const branch = findBranch(remaining, nodes, context);
    if (branch === undefined) {
      return getRoutingError(remaining);
    }
    addBranch(branch, context);
    nodes.push(getContactNode(branch.contact));
    remaining.splice(remaining.indexOf(branch.contact), 1);
  }
  return undefined;
}

export function routeMatrixOutput(
  contacts: readonly MatrixContact[],
  context: TreeContext,
): string | undefined {
  if (contacts.length === 0) {
    return undefined;
  }
  const output: TreeNode = {
    id: context.terminalId,
    at: context.output,
    end: { kind: 'free', at: context.output, terminalId: context.terminalId },
  };
  const branch = findBranch(contacts, [output], context);
  if (branch === undefined) {
    return getRoutingError(contacts);
  }
  addBranch(branch, context);
  return undefined;
}

function getContactNode(contact: MatrixContact): TreeNode {
  return {
    id: `${contact.keyId}:${contact.pin}`,
    at: contact.at,
    end: { kind: 'key-pin', keyId: contact.keyId, pin: contact.pin },
  };
}

function getRoutingError(contacts: readonly MatrixContact[]) {
  return `Cannot connect ${contacts[0]?.keyId ?? 'key'} safely. Separate overlapping contacts or move the key, then rebuild.`;
}

function addBranch(
  branch: {
    readonly contact: MatrixContact;
    readonly node: TreeNode;
    readonly path: readonly WirePoint[];
  },
  context: TreeContext,
) {
  const id = createEntityId({ prefix: 'w', existingIds: context.wires.map((wire) => wire.id) });
  const { contact, node, path } = branch;
  context.wires.push({
    id,
    start: getContactNode(contact).end,
    end: node.end,
    bends: path.slice(1, -1),
  });
  context.labels.set(id, context.terminalId);
  appendSegments(path, context);
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
