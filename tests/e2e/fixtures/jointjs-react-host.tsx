import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkSurface } from '@ui/canvas/components';
import { SchematicDiagram } from '@ui/schematic/diagram/components';
import { PreferencesProvider } from '@ui/preferences';
import { ProjectProvider } from '@ui/project/components';
import { loadProject } from '@storage/project';
import type { SurfaceContent } from '@ui/canvas/logic';
import '../../../src/styles.css';

const host = document.querySelector('[data-react-host]');
if (!(host instanceof HTMLElement)) {
  throw new Error('Missing React test host');
}
const root = createRoot(host);
let capture: { element: Element; pointerId: number } | undefined;
function report(message: string) {
  const output = document.querySelector('output');
  if (output !== null) {
    output.textContent = message;
  }
}
const content: SurfaceContent = {
  kind: 'host',
  label: 'Shared diagram surface',
  renderHost: (view) => (
    <SchematicDiagram
      input={{
        view,
        cells: [
          {
            id: 'part:k0',
            markup: [{ tagName: 'rect', selector: 'key' }],
            attributes: { key: { x: 1, y: 1, width: 1, height: 1, fill: 'currentColor' } },
          },
        ],
      }}
    />
  ),
  onPointerDown: (_, event) => {
    capture = { element: event.currentTarget, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    report('Draft active');
  },
  onPointerUp: () => {
    if (capture !== undefined) {
      report('Completed');
    }
    capture = undefined;
  },
  onPointerCancel: () => {
    capture = undefined;
    report('Cancelled');
  },
};
function mount() {
  root.render(
    <StrictMode>
      <PreferencesProvider>
        <ProjectProvider initialLoad={loadProject()}>
          <WorkSurface workspaceId="schematic" content={content} />
        </ProjectProvider>
      </PreferencesProvider>
    </StrictMode>,
  );
}
document.querySelector('[data-hide]')?.addEventListener('click', () => {
  root.render(null);
});
document.querySelector('[data-show]')?.addEventListener('click', mount);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && capture !== undefined) {
    const pending = capture;
    capture = undefined;
    pending.element.releasePointerCapture(pending.pointerId);
  }
});
mount();
