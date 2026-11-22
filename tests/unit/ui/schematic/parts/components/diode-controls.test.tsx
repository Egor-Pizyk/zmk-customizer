import { createProject } from '@domain/project';
import type { Project } from '@domain';
import { DiodeButtons } from '@ui/schematic/parts/components';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

it('canvas exposes two labeled toggles, the opposite disabled state, and low zoom fallback', () => {
  const project: Project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
  };
  const commit = vi.fn<(change: (project: Project) => Project) => void>();
  const view = { zoom: 1, pxPerU: 48, panXPx: 0, panYPx: 0 };
  const markup = renderToStaticMarkup(
    <svg>
      <DiodeButtons commit={commit} project={project} view={view} />
    </svg>,
  );
  expect(markup).toContain('Remove diode at key 0 pin 1');
  expect(markup).toContain('Add diode at key 0 pin 2');
  expect(markup).toContain('aria-disabled="true"');
  expect(markup).toContain('Remove the diode at the other pin first');
  expect(
    renderToStaticMarkup(
      <DiodeButtons commit={commit} project={project} view={{ ...view, zoom: 0.25 }} />,
    ),
  ).toBe('');
});
