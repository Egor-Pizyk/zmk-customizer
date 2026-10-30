import { dia } from '@joint/core';
import { syncDiagram } from './sync-diagram';
import { captureDiagramFocus } from './sync-diagram-focus';
import { runDiagramOperation } from './diagram-recovery';
import type { DiagramCell, DiagramInput, DiagramResult } from './diagram-types';

export function createDiagram(host: HTMLElement): DiagramResult {
  const svg = host.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (typeof svg.createSVGMatrix !== 'function') {
    return { kind: 'unavailable' };
  }
  const scene = host.ownerDocument.createElement('div');
  scene.className = 'size-full';
  host.append(scene);
  const result = runDiagramOperation(() => {
    const graph = new dia.Graph({}, { cellNamespace: {} });
    return { graph, paper: createPaper(scene, graph) };
  });
  if (!result.ok) {
    scene.remove();
    return { kind: 'unavailable' };
  }
  return createLifetime(host, scene, result.value);
}

function createLifetime(
  host: HTMLElement,
  scene: HTMLElement,
  { graph, paper }: { readonly graph: dia.Graph; readonly paper: dia.Paper },
): DiagramResult {
  let isDisposed = false;
  let previousInput: DiagramInput | undefined;
  let previous: ReadonlyMap<string, DiagramCell> = new Map();
  return {
    kind: 'ready',
    sync: (input) => {
      if (isDisposed) {
        return false;
      }
      if (input === previousInput) {
        return true;
      }
      const restoreFocus = captureDiagramFocus(host);
      if (!updatePaper({ graph, paper }, input, previous)) {
        return false;
      }
      previousInput = input;
      previous = new Map(input.cells.map((cell) => [cell.id, cell]));
      restoreFocus();
      return true;
    },
    dispose: () => {
      if (isDisposed) {
        return;
      }
      isDisposed = true;
      runDiagramOperation(() => paper.remove());
      runDiagramOperation(() => graph.clear());
      runDiagramOperation(() => graph.off());
      scene.remove();
    },
  };
}

function updatePaper(
  { graph, paper }: { readonly graph: dia.Graph; readonly paper: dia.Paper },
  input: DiagramInput,
  previous: ReadonlyMap<string, DiagramCell>,
) {
  if (
    !runDiagramOperation(() => {
      paper.freeze();
    }).ok
  ) {
    return false;
  }
  if (!syncDiagram({ graph, paper }, input, previous)) {
    return false;
  }
  return runDiagramOperation(() => {
    paper.scale(input.view.pxPerU);
    paper.translate(input.view.panXPx, input.view.panYPx);
    paper.unfreeze();
  }).ok;
}

function createPaper(scene: HTMLElement, graph: dia.Graph) {
  return new dia.Paper({
    el: scene,
    model: graph,
    width: '100%',
    height: '100%',
    async: false,
    sorting: dia.Paper.sorting.EXACT,
    interactive: false,
    guard: () => true,
    drawGrid: false,
    snapLinks: false,
    linkPinning: false,
    embeddingMode: false,
    validateMagnet: () => false,
    validateConnection: () => false,
    preventDefaultBlankAction: false,
    preventDefaultViewAction: false,
  });
}
