// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('cancels completion without saving and applies it as one undoable edit', async () => {
  const source = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Complete wiring' }));
  expect(screen.getByText('Wiring preview', { exact: true })).toBeTruthy();
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Complete wiring' }));
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  await waitFor(() => {
    expect(loadProject().project.wires).toHaveLength(2);
  });
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await waitFor(() => {
    expect(loadProject().project).toEqual(source);
  });
});
