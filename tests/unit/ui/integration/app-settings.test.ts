import { loadProject } from '@storage/project';
import { loadPreferences } from '@storage/preferences';
// @vitest-environment jsdom
import { screen, within, fireEvent } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';

it('applies theme and grid settings, rejects invalid grid input and resets settings without touching the project or workspace', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'export' });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  const dialog = screen.getByRole('dialog', { name: 'Settings' });
  await user.click(within(dialog).getByRole('radio', { name: 'Dark' }));
  expect(document.documentElement.dataset['theme']).toBe('dark');
  const grid = within(dialog).getByRole('textbox', { name: 'Grid size (u)' });
  await user.clear(grid);
  await user.type(grid, '0{Enter}');
  expect(grid.getAttribute('aria-invalid')).toBe('true');
  expect(loadPreferences().preferences.gridSizeU).toBe(0.25);
  await user.clear(grid);
  await user.type(grid, '0.5{Enter}');
  expect(loadPreferences().preferences.gridSizeU).toBe(0.5);
  await user.click(within(dialog).getByRole('switch', { name: 'Show grid' }));
  expect(loadPreferences().preferences.isGridVisible).toBe(false);
  await user.click(within(dialog).getByRole('button', { name: 'Reset to defaults' }));
  expect(loadPreferences().preferences.gridSizeU).toBe(0.25);
  expect(loadPreferences().preferences.isGridVisible).toBe(true);
  expect(document.documentElement.dataset['theme']).toBeUndefined();
  expect(loadPreferences().preferences.activeWorkspaceId).toBe('export');
  expect(loadProject().project).toEqual(before);
});

it('global shortcuts navigate by physical key code but leave text fields and open dialogs alone', async () => {
  const { user } = renderApp();
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.click(name);
  fireEvent.keyDown(name, { key: '¡', code: 'Digit2', altKey: true, shiftKey: true });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Schematic');
  await user.click(screen.getByRole('heading', { level: 1 }));
  fireEvent.keyDown(document, { key: '¡', code: 'Digit2', altKey: true, shiftKey: true });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Bindings');
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  fireEvent.keyDown(document, { key: '4', code: 'Digit4', altKey: true, shiftKey: true });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Bindings');
});

it('keeps a cleared numeric draft and Escape from changing saved key geometry; Enter commits one undo step', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.tab();
  expect(loadProject().project).toEqual(before);
  await user.clear(x);
  await user.type(x, '20{Escape}');
  expect(loadProject().project).toEqual(before);
  await user.clear(x);
  await user.type(x, '20{Enter}');
  expect(loadProject().project.keys[0]?.xU).toBe(20);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});
