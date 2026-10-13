// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { createProject } from '@domain';
import { loadProject } from '@storage/project';

it('opens Problems, navigates an issue and returns focus to its toggle when closed', async () => {
  const { user } = renderApp(createProject({ controllerId: 'nice_nano_v2' }));
  const before = loadProject().project;
  const toggle = screen.getByRole('button', { name: /^Problems \(/u });
  await user.click(toggle);
  const panel = screen.getByRole('region', { name: 'Problems' });
  expect(within(panel).getByRole('button', { name: /project has no keys/u })).toBeTruthy();
  await user.click(within(panel).getByRole('button', { name: /project has no keys/u }));
  expect(screen.getByRole('heading', { name: 'Schematic', level: 1 })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Close problems' }));
  expect(screen.queryByRole('region', { name: 'Problems' })).toBeNull();
  expect(document.activeElement).toBe(toggle);
  expect(loadProject().project).toEqual(before);
});

it('shows No problems for a valid project without changing its saved data', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Problems (0)' }));
  expect(
    within(screen.getByRole('region', { name: 'Problems' })).getByText('No problems'),
  ).toBeTruthy();
  expect(loadProject().project).toEqual(before);
});
