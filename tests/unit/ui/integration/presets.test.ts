// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { UNIBODY_PRESET } from '@catalog/presets';
import { renderApp } from '../../../helpers/render-app';

it('browses without writes, cancels without losing history, creates a split empty layout and preserves the starter', async () => {
  const { user } = renderApp();
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Kept work{Enter}');
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.selectOptions(screen.getByLabelText('Keyboard preset'), 'corne-42');
  expect(screen.getByText('42 keys · Split, left and right halves')).toBeTruthy();
  expect(
    screen.getByLabelText('Corne 6-column layout preview').querySelectorAll('rect'),
  ).toHaveLength(42);
  await user.click(screen.getByRole('radio', { name: 'Empty keymap' }));
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.selectOptions(screen.getByLabelText('Keyboard preset'), 'corne-42');
  await user.click(screen.getByRole('radio', { name: 'Empty keymap' }));
  await user.click(screen.getByRole('button', { name: 'Create project from preset' }));
  const created = loadProject().project;
  expect(created.keys).toHaveLength(42);
  expect(created.keys[39]?.half).toBe('right');
  expect(created.layers[0]?.bindings).toEqual({});
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByRole('button', { name: 'Start six-key unibody preset' }));
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
});

it('creates default nine-key QWERTY, edits with exact history, and blocks incomplete export', async () => {
  const { user } = renderApp();
  await user.click(screen.getByRole('button', { name: 'New' }));
  const dialog = screen.getByRole('dialog', { name: 'Start a new project?' });
  expect(
    within(dialog).getByRole('radio', { name: 'QWERTY' }).getAttribute('checked'),
  ).not.toBeNull();
  await user.click(screen.getByRole('button', { name: 'Create project from preset' }));
  const created = loadProject().project;
  expect(created.keys).toHaveLength(9);
  expect(created.layers[0]?.bindings['k8']).toEqual({
    kind: 'kp',
    key: { keycode: 'N9', modifiers: [] },
  });
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited pad{Enter}');
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(created);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.name).toBe('Edited pad');
  await user.click(screen.getByRole('button', { name: /^Export/u }));
  expect(
    screen.getByRole('button', { name: /^Download \.zip/u }).getAttribute('aria-disabled'),
  ).toBe('true');
});
