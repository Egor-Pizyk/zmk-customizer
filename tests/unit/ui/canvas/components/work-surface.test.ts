// @vitest-environment jsdom
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWorkSurface } from '../../../../helpers/render-work-surface';

describe('shared work surface content ownership', () => {
  it('renders an exclusive external host with the shared camera and grid', () => {
    renderWorkSurface('schematic', {
      kind: 'host',
      label: 'External schematic',
      renderHost: (view) => createElement('p', {}, `Host scale ${view.pxPerU}`),
      renderScreen: () => createElement('text', {}, 'Native controls'),
    });
    const canvas = screen.getByRole('application', { name: 'External schematic' });
    expect(canvas.tagName).toBe('DIV');
    expect(screen.getByText(/^Host scale/u)).toBeTruthy();
    expect(screen.getByText('Native controls')).toBeTruthy();
    expect(screen.getAllByRole('application')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Zoom in' })).toHaveLength(1);
  });

  it('retains SVG world and screen rendering for Bindings', () => {
    renderWorkSurface('bindings', {
      render: () => createElement('text', {}, 'World content'),
      renderScreen: () => createElement('text', {}, 'Screen content'),
    });
    expect(screen.getByRole('application').tagName.toLowerCase()).toBe('svg');
    expect(screen.getByText('World content').parentElement?.getAttribute('transform')).toContain(
      'scale(',
    );
    expect(screen.getByText('Screen content').parentElement?.tagName.toLowerCase()).toBe('svg');
  });
});
