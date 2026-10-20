// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('collapses, expands and closes editors without changing project history', async () => {
  const source = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByRole('button', { name: 'Collapse editors' }));
  await user.click(screen.getByRole('button', { name: 'Expand editors' }));
  await user.click(screen.getByRole('button', { name: 'Close editors' }));
  const opener = screen.getByRole('button', { name: 'Open editors' });
  await waitFor(() => {
    expect(document.activeElement).toBe(opener);
  });
  expect(loadProject().project).toEqual(source);
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
  await user.click(opener);
  expect(screen.getByRole('region', { name: 'Wire sections' })).toBeTruthy();
});
