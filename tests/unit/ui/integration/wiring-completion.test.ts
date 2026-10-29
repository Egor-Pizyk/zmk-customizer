// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('cancels rebuilding without saving and applies it as one undoable edit', async () => {
  const source = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  expect(screen.queryByRole('button', { name: 'Complete wiring' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  expect(screen.getByText('Wiring preview', { exact: true })).toBeTruthy();
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  await waitFor(() => {
    expect(loadProject().project.wires).toHaveLength(3);
  });
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await waitFor(() => {
    expect(loadProject().project).toEqual(source);
  });
});

it('inspects proposed sections by keyboard without deleting or cancelling them on tool selection', async () => {
  const source = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  expect(screen.queryByRole('button', { name: 'Complete wiring' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await user.click(screen.getByText('Inspect wire sections', { exact: true }));
  const inspector = screen.getByRole('group', { name: 'Inspect wire sections' });
  const section = within(inspector).getByRole('checkbox', { name: /^Section 1,/u });
  await user.click(section);
  expect(section).toHaveProperty('checked', true);
  expect(within(inspector).queryByRole('button', { name: 'Delete selected sections' })).toBeNull();
  await user.keyboard('{Delete}');
  expect(screen.getByRole('button', { name: 'Apply wiring' })).toBeTruthy();
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('radio', { name: 'Wire' }));
  expect(screen.getByRole('radio', { name: 'Select' })).toHaveProperty('checked', true);
  expect(screen.getByRole('button', { name: 'Apply wiring' })).toBeTruthy();
  await user.click(section);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('button', { name: 'Apply wiring' })).toBeNull();
  expect(
    screen.getByText('Wiring preview cancelled. Saved wiring restored.', { exact: true }),
  ).toBeTruthy();
  expect(loadProject().project).toEqual(source);
});
