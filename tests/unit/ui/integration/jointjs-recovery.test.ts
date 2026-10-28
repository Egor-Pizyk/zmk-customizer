// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

it('keeps save/history available and retries the latest accepted project after renderer failure', async () => {
  const matrix = vi.spyOn(SVGSVGElement.prototype, 'createSVGMatrix').mockImplementation(() => {
    throw new DOMException('SVG capability unavailable', 'NotSupportedError');
  });
  const { user } = renderApp();
  const source = loadProject().project;
  expect(screen.getByRole('button', { name: 'Retry diagram' })).toBeDefined();
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Retry diagram' }));
  expect(screen.getByRole('button', { name: 'Retry diagram' })).toBeDefined();
  expect(loadProject().project).toEqual(source);
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.type(x, '0.25{Enter}');
  const accepted = loadProject().project;
  expect(accepted.keys[0]?.xU).toBe(0.25);
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  await user.click(canvas);
  await user.keyboard('{Delete}');
  expect(loadProject().project).toEqual(accepted);
  matrix.mockRestore();
  await user.click(screen.getByRole('button', { name: 'Retry diagram' }));
  expect(screen.queryByRole('button', { name: 'Retry diagram' })).toBeNull();
  expect(document.querySelectorAll('.joint-paper [data-key-focus-id="k0"]')).toHaveLength(1);
  expect(loadProject().project).toEqual(accepted);
  expect(document.activeElement).toBe(canvas);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});

it('detaches an existing scene when a guarded update loses an SVG capability', async () => {
  const { user } = renderApp();
  const source = loadProject().project;
  const matrix = vi.spyOn(SVGSVGElement.prototype, 'createSVGMatrix').mockImplementation(() => {
    throw new DOMException('SVG state lost', 'InvalidStateError');
  });
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.type(x, '0.25{Enter}');
  expect(screen.getByRole('button', { name: 'Retry diagram' })).toBeDefined();
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(0);
  expect(loadProject().project.keys[0]?.xU).toBe(0.25);
  matrix.mockRestore();
  await user.click(screen.getByRole('button', { name: 'Retry diagram' }));
  expect(screen.queryByRole('button', { name: 'Retry diagram' })).toBeNull();
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});
