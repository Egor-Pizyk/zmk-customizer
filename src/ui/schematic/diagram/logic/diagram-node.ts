import type { DiagramCell, DiagramMarkup } from './diagram-types';
import type { CanvasHit } from '@ui/schematic/interaction';

type Attributes = Readonly<Record<string, string | number | boolean>>;
export type DiagramNode = {
  readonly tagName: string;
  readonly attributes: Attributes;
  readonly children: readonly DiagramNode[];
};
export function diagramNode(
  tagName: string,
  attributes: Attributes,
  children: readonly DiagramNode[] = [],
): DiagramNode {
  return { tagName, attributes, children };
}
export function buildDiagramCell(
  id: string,
  root: DiagramNode,
  reference?: CanvasHit,
): DiagramCell {
  const attributes = new Map<string, Attributes>();
  const markup = toMarkup(root, attributes);
  return {
    id,
    ...(reference === undefined ? {} : { reference }),
    markup: [markup],
    attributes: Object.fromEntries(attributes),
  };
}
function toMarkup(node: DiagramNode, attributes: Map<string, Attributes>): DiagramMarkup {
  const selector = `node${attributes.size}`;
  attributes.set(selector, node.attributes);
  return {
    tagName: node.tagName,
    selector,
    children: node.children.map((child) => toMarkup(child, attributes)),
  };
}
