// @vitest-environment jsdom
import { getDefinedValue } from '../../../../../helpers/defined-value';
import type { DiagramResult } from '@ui/schematic/diagram/logic';
import { expect, it, vi } from 'vitest';
import { installDiagramPlatform } from '../../../../../helpers/diagram-platform';
import { createDiagram } from '@ui/schematic/diagram/logic';

it('reports an unsupported SVG host without mutating it or accepted input', () => {
  const host = document.createElement('div');
  host.append(document.createTextNode('Retained host'));
  const nativeMatrix = getDefinedValue(
    Object.getOwnPropertyDescriptor(SVGSVGElement.prototype, 'createSVGMatrix'),
  );
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGMatrix', {
    configurable: true,
    value: undefined,
  });
  const result = createDiagram(host);
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGMatrix', nativeMatrix);
  expect(result.kind).toBe('unavailable');
  expect(host.textContent).toBe('Retained host');
  expect(host.querySelector('svg')).toBeNull();
});

it('keeps descriptor data unchanged and the React host alive across sync/disposal', () => {
  installDiagramPlatform();
  const host = document.createElement('div');
  document.body.append(host);
  const scene = getReadyDiagram(createDiagram(host));
  const input = {
    cells: [
      {
        id: 'section:w1:0',
        markup: [{ tagName: 'path', selector: 'wire' }],
        attributes: { wire: { d: 'M 1 2 L 3 2', fill: 'none' } },
      },
    ],
    view: { pxPerU: 48, panXPx: 0, panYPx: 0, zoom: 1 },
  };
  const before = JSON.stringify(input);
  scene.sync(input);
  const wire = host.querySelector('path[joint-selector="wire"]');
  scene.sync(input);
  expect(host.querySelector('path[joint-selector="wire"]')).toBe(wire);
  expect(wire?.getAttribute('d')).toBe('M 1 2 L 3 2');
  scene.sync({
    ...input,
    cells: [
      {
        id: 'section:w1:0',
        markup: [{ tagName: 'path', selector: 'wire' }],
        attributes: { wire: { d: 'M 1 2 L 4 2', fill: 'none' } },
      },
    ],
  });
  expect(host.querySelector('path[joint-selector="wire"]')).toBe(wire);
  expect(wire?.getAttribute('d')).toBe('M 1 2 L 4 2');
  expect(JSON.stringify(input)).toBe(before);
  scene.dispose();
  scene.dispose();
  expect(host.isConnected).toBe(true);
  expect(host.childElementCount).toBe(0);
  host.remove();
});

function getReadyDiagram(scene: DiagramResult) {
  if (scene.kind !== 'ready') {
    throw new Error('Missing supported scene');
  }
  return scene;
}

it('removes obsolete selection attributes while keeping the same projected path', () => {
  const host = document.createElement('div');
  const scene = getReadyDiagram(createDiagram(host));
  const descriptor = {
    id: 'section:w1:0',
    markup: [{ tagName: 'path', selector: 'wire' }],
    attributes: { wire: { d: 'M 1 2 L 3 2' } },
  };
  const view = { pxPerU: 48, panXPx: 0, panYPx: 0, zoom: 1 };
  scene.sync({
    view,
    cells: [
      {
        ...descriptor,
        attributes: { wire: { ...descriptor.attributes.wire, 'data-selected': 'true' } },
      },
    ],
  });
  const path = getDefinedValue(host.querySelector<SVGPathElement>('path'));
  expect(Object.hasOwn(path.dataset, 'selected')).toBe(true);
  scene.sync({ view, cells: [descriptor] });
  expect(host.querySelector<SVGPathElement>('path')).toBe(path);
  expect(Object.hasOwn(path.dataset, 'selected')).toBe(false);
  scene.dispose();
});

it('keeps paint order and surviving keyboard focus after middle insertion and reordering', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const scene = getReadyDiagram(createDiagram(host));
  const view = { pxPerU: 48, panXPx: 0, panYPx: 0, zoom: 1 };
  const cells = ['a', 'b', 'c'].map((id) => ({
    id,
    markup: [{ tagName: 'g', selector: 'part' }],
    attributes: { part: { 'data-key-focus-id': id, tabindex: 0 } },
  }));
  const first = getDefinedValue(cells[0]);
  const middle = getDefinedValue(cells[1]);
  const last = getDefinedValue(cells[2]);
  scene.sync({ view, cells: [first, last] });
  const focus = getDefinedValue(host.querySelector<SVGElement>('[data-key-focus-id="a"]'));
  focus.focus();
  scene.sync({ view, cells: [last, middle, first] });
  expect(
    Array.from(host.querySelectorAll('[model-id]'), (element) => element.getAttribute('model-id')),
  ).toEqual(['c', 'b', 'a']);
  expect(document.activeElement).toBe(focus);
  scene.dispose();
  host.remove();
});

it('updates geometry without detaching surviving artwork from its DOM parent', () => {
  const host = document.createElement('div');
  const scene = getReadyDiagram(createDiagram(host));
  const view = { pxPerU: 48, panXPx: 0, panYPx: 0, zoom: 1 };
  const cells = ['a', 'b'].map((id) => ({
    id,
    markup: [{ tagName: 'path', selector: 'wire' }],
    attributes: { wire: { d: 'M 1 2 L 3 2' } },
  }));
  scene.sync({ view, cells });
  const observer = new MutationObserver(vi.fn<MutationCallback>());
  observer.observe(host, { childList: true, subtree: true });
  scene.sync({
    view,
    cells: cells.map((cell) => ({
      id: cell.id,
      markup: cell.markup,
      attributes: { wire: { d: 'M 1 2 L 4 2' } },
    })),
  });
  expect(observer.takeRecords()).toEqual([]);
  expect(host.querySelector('path')?.getAttribute('d')).toBe('M 1 2 L 4 2');
  observer.disconnect();
  scene.dispose();
});
