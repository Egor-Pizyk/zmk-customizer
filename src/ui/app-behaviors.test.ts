// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../tests/helpers/render-app';
import { loadProject } from '../storage/project-storage';

it('toggles key modifiers through the UI and exports the changed binding', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 0' }));
  await user.click(
    within(screen.getByRole('group', { name: 'Hold with the key' })).getByRole('button', {
      name: 'Left Ctrl',
    }),
  );
  expect(loadProject().project.layers[0]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'A', modifiers: ['LC'] },
  });
  await user.click(screen.getByRole('button', { name: 'Export' }));
  expect(screen.getByLabelText('config/unibody_six.keymap').textContent).toContain('&kp LC(A)');
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('adds/removes tap-dance taps and commits valid timing while rejecting out-of-range timing', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 3' }));
  await user.click(screen.getByRole('button', { name: 'Add tap' }));
  expect(loadProject().project.layers[0]?.bindings['k3']).toMatchObject({
    taps: [{ keycode: 'C' }, { keycode: 'D' }, { keycode: 'A' }],
  });
  await user.click(screen.getByRole('button', { name: 'Remove tap 3' }));
  expect(loadProject().project).toEqual(before);
  const pause = screen.getByRole('spinbutton', {
    name: 'Pause after the last tap in milliseconds',
  });
  await user.clear(pause);
  await user.type(pause, '5001{Enter}');
  expect(pause.getAttribute('aria-invalid')).toBe('true');
  expect(loadProject().project).toEqual(before);
  await user.clear(pause);
  await user.type(pause, '300{Enter}');
  expect(loadProject().project.layers[0]?.bindings['k3']).toMatchObject({ tappingTermMs: 300 });
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('changes mod-morph triggers independently of key modifiers and preserves the normal/morphed actions', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 4' }));
  await user.click(
    within(screen.getByRole('group', { name: 'Morph while held (at least one)' })).getByRole(
      'button',
      { name: 'Left Ctrl' },
    ),
  );
  expect(loadProject().project.layers[0]?.bindings['k4']).toMatchObject({
    mods: ['LC', 'LS', 'RS'],
    normal: { keycode: 'BACKSPACE' },
    morphed: { keycode: 'DELETE' },
  });
  expect(loadProject().project.layers[1]).toEqual(before.layers[1]);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});
