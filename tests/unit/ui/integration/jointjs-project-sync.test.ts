// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import { loadProject } from '@storage/project';

it('opens the real projected scene without a load-time save or history entry', async () => {
  const save = vi.spyOn(Storage.prototype, 'setItem');
  const { user } = renderApp();
  await waitFor(() => {
    expect(document.querySelectorAll('.joint-paper')).toHaveLength(1);
  });
  expect(save.mock.calls.filter(([key]) => key === 'zmk-customizer:project')).toHaveLength(1);
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
  expect(
    within(screen.getByRole('banner'))
      .getByRole('button', { name: /^Undo/u })
      .getAttribute('aria-disabled'),
  ).toBe('true');
  await user.click(screen.getByRole('button', { name: /^Bindings(?:,|$)/u }));
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: /^Schematic(?:,|$)/u }));
  await waitFor(() => {
    expect(document.querySelectorAll('.joint-paper')).toHaveLength(1);
  });
  expect(save.mock.calls.filter(([key]) => key === 'zmk-customizer:project')).toHaveLength(1);
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
});

it('refreshes numeric edits and exact history while retaining one scene', async () => {
  const { user } = renderApp();
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.type(x, '0.25{Enter}');
  expect(loadProject().project.keys[0]?.xU).toBe(0.25);
  expect(document.querySelectorAll('.joint-paper [data-key-focus-id="k0"]')).toHaveLength(1);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.keys[0]?.xU).toBe(0.25);
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(1);
});
