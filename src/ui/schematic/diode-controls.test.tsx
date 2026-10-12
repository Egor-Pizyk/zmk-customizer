import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { createProject } from '../../domain/create-project';
import type { Project } from '../../domain/types';
import { DiodeSymbol } from './diode-symbol';
import { DiodeButtons } from './diode-buttons';

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

it('symbol follows position and flips the cathode bar', () => {
  const key = { id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } } as const;
  const original = renderToStaticMarkup(
    <svg>
      <DiodeSymbol schematicKey={key} />
    </svg>,
  );
  const moved = renderToStaticMarkup(
    <svg>
      <DiodeSymbol schematicKey={{ ...key, xU: 2 }} />
    </svg>,
  );
  expect(moved).not.toBe(original);
  expect(original).toContain('rotate(0)');
  expect(
    renderToStaticMarkup(
      <svg>
        <DiodeSymbol schematicKey={{ ...key, diode: { pin: 1, cathode: 'toward-switch' } }} />
      </svg>,
    ),
  ).toContain('rotate(180)');
});

it('joins the wire terminal with continuous leads in both polarities without moving wires', () => {
  for (const cathode of ['away-switch', 'toward-switch'] as const) {
    const markup = renderToStaticMarkup(
      <svg>
        <DiodeSymbol schematicKey={{ id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode } }} />
      </svg>,
    );
    expect(markup).toContain('translate(0.3 0.3667) rotate(-90)');
    expect(markup).toContain('d="M0 0 H0.105 M0.215 0 H0.32"');
  }
});
