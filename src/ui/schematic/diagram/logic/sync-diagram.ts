import { dia } from '@joint/core';
import { runDiagramOperation } from './diagram-recovery';
import type { DiagramCell, DiagramInput, DiagramMarkup } from './diagram-types';

function copyMarkup(markup: readonly DiagramMarkup[]): dia.MarkupJSON {
  return markup.map((node) => ({
    tagName: node.tagName,
    ...(node.selector === undefined ? {} : { selector: node.selector }),
    ...(node.attributes === undefined ? {} : { attributes: { ...node.attributes } }),
    ...(node.children === undefined ? {} : { children: copyMarkup(node.children) }),
  }));
}

type Renderer = { readonly graph: dia.Graph; readonly paper: dia.Paper };
type CellPosition = { readonly index: number; readonly previous: DiagramCell | undefined };
type CellContext = Renderer & { readonly existing: dia.Cell | undefined };

export function syncDiagram(
  renderer: Renderer,
  input: DiagramInput,
  previous: ReadonlyMap<string, DiagramCell>,
) {
  const { graph } = renderer;
  if (previous.size === 0) {
    return resetCells(graph, input);
  }
  const cellsById = new Map(graph.getCells().map((cell) => [cell.id, cell]));
  const retained = new Set(input.cells.map((cell) => cell.id));
  if (!removeMissingCells(graph, retained)) {
    return false;
  }
  let hasOrderingChanges = false;
  for (const [index, descriptor] of input.cells.entries()) {
    const hasNewPosition = cellsById.get(descriptor.id)?.get('z') !== index;
    const result = syncCell({ ...renderer, existing: cellsById.get(descriptor.id) }, descriptor, {
      index,
      previous: previous.get(descriptor.id),
    });
    if (result === 'unavailable') {
      return false;
    }
    hasOrderingChanges ||= hasNewPosition;
  }
  return (
    !hasOrderingChanges ||
    runDiagramOperation(() => {
      sortCells(graph);
    }).ok
  );
}
function resetCells(graph: dia.Graph, input: DiagramInput) {
  const definitions = input.cells.map((cell, index) =>
    createDefinition(cell, { attributes: getAttributes(cell), index }),
  );
  return runDiagramOperation(() =>
    graph.resetCells(definitions.map((definition) => new dia.Element(definition))),
  ).ok;
}
function removeMissingCells(graph: dia.Graph, retained: ReadonlySet<string>) {
  for (const cell of graph.getCells()) {
    if (!retained.has(String(cell.id)) && !runDiagramOperation(() => cell.remove()).ok) {
      return false;
    }
  }
  return true;
}
function syncCell(
  { graph, paper, existing }: CellContext,
  descriptor: DiagramCell,
  position: CellPosition,
) {
  if (existing !== undefined && isUnchanged(existing, descriptor, position)) {
    return 'unchanged';
  }
  const attributes = getAttributes(descriptor, position.previous);
  if (existing !== undefined) {
    return updateExistingCell({ existing, paper }, descriptor, { ...position, attributes })
      ? 'updated'
      : 'unavailable';
  }
  const definition = createDefinition(descriptor, { attributes, index: position.index });
  return runDiagramOperation(() => graph.addCell(new dia.Element(definition), { sort: false })).ok
    ? 'updated'
    : 'unavailable';
}

function getAttributes(descriptor: DiagramCell, previous?: DiagramCell) {
  return Object.fromEntries(
    Object.entries(descriptor.attributes).map(([selector, values]) => [
      selector,
      {
        ...Object.fromEntries(
          Object.keys(previous?.attributes[selector] ?? {})
            .filter((name) => !(name in values))
            .map((name) => [name, null]),
        ),
        ...values,
      },
    ]),
  );
}

function createDefinition(
  descriptor: DiagramCell,
  {
    attributes,
    index,
  }: { readonly attributes: ReturnType<typeof getAttributes>; readonly index: number },
) {
  return {
    id: descriptor.id,
    type: 'Schematic.Part',
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    markup: copyMarkup(descriptor.markup),
    attrs: attributes,
    z: index,
  };
}

function isUnchanged(
  cell: dia.Cell,
  descriptor: DiagramCell,
  { previous, index }: { readonly previous: DiagramCell | undefined; readonly index: number },
) {
  return (
    cell.get('z') === index &&
    JSON.stringify(previous?.markup) === JSON.stringify(descriptor.markup) &&
    JSON.stringify(previous?.attributes) === JSON.stringify(descriptor.attributes)
  );
}

function getChangedAttributes(
  attributes: ReturnType<typeof getAttributes>,
  previous: DiagramCell | undefined,
) {
  return Object.fromEntries(
    Object.entries(attributes).flatMap(([selector, values]) => {
      const changed = Object.fromEntries(
        Object.entries(values).filter(
          ([name, value]) => value !== previous?.attributes[selector]?.[name],
        ),
      );
      return Object.keys(changed).length === 0 ? [] : [[selector, changed]];
    }),
  );
}

function updateExistingCell(
  { existing, paper }: { readonly existing: dia.Cell; readonly paper: dia.Paper },
  descriptor: DiagramCell,
  {
    attributes,
    index,
    previous,
  }: {
    readonly attributes: ReturnType<typeof getAttributes>;
    readonly index: number;
    readonly previous: DiagramCell | undefined;
  },
) {
  const markup =
    JSON.stringify(previous?.markup) === JSON.stringify(descriptor.markup)
      ? undefined
      : copyMarkup(descriptor.markup);
  const delta = getChangedAttributes(attributes, previous);
  return runDiagramOperation(() => {
    if (markup === undefined) {
      if (existing.get('z') !== index) {
        existing.set('z', index, { sort: false });
      }
      existing.set({ attrs: attributes }, { silent: true });
      paper.findViewByModel<dia.ElementView>(existing).update(undefined, delta);
    } else {
      // New markup creates new SVG nodes: reset attributes from the old selector
      // positions (notably text:null) must not clear a newly created group.
      existing.set({ attrs: getAttributes(descriptor), z: index, markup }, { sort: false });
    }
  }).ok;
}

function sortCells(graph: dia.Graph) {
  const collection = graph.getLayer(graph.defaultLayerId).cellCollection;
  const sortCollection = collection.sort.bind(collection);
  sortCollection();
}
