import { createDiagram } from '@ui/schematic/diagram/logic';

function getHost() {
  const host = document.querySelector('[data-diagram-host]');
  if (!(host instanceof HTMLElement)) {
    throw new Error('Missing test host');
  }
  return host;
}
const host = getHost();
let scene: ReturnType<typeof createDiagram> | undefined;
const input = {
  view: { pxPerU: 48, zoom: 1, panXPx: 20, panYPx: 30 },
  cells: [
    {
      id: 'section:w1:0',
      markup: [{ tagName: 'path', selector: 'conductor' }],
      attributes: {
        root: { tabindex: 0, role: 'graphics-symbol', 'aria-label': 'Wire 1' },
        conductor: {
          d: 'M 1 2 L 3 2 L 3 4',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 0.05,
        },
      },
    },
  ],
};
function mount() {
  if (scene?.kind === 'ready') {
    scene.dispose();
  }
  scene = createDiagram(host);
  if (scene.kind !== 'ready') {
    throw new Error('Browser does not support the diagram');
  }
  scene.sync(input);
}
document.querySelector('button[data-mount]')?.addEventListener('click', mount);
document.querySelector('button[data-dispose]')?.addEventListener('click', () => {
  if (scene?.kind === 'ready') {
    scene.dispose();
  }
});
mount();

host.addEventListener('keydown', () => {
  if (scene?.kind === 'ready') {
    scene.sync(input);
  }
});
