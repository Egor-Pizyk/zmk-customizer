// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { renderApp } from '../../../helpers/render-app';
import { buildLockedWiringProject } from '../../../helpers/symmetric-wiring-fixtures';

it('exposes a keyboard lock control and preserves lock state through history and reload', async () => {
  const { user, unmount, mount } = renderApp(buildLockedWiringProject());
  const unlock = screen.getByRole('button', { name: 'Unlock wire 0' });
  expect(unlock.getAttribute('aria-pressed')).toBe('true');
  unlock.focus();
  await user.keyboard('{Enter}');
  expect(loadProject().project.wires[0]?.locked).toBeUndefined();
  const banner = within(screen.getByRole('banner'));
  await user.click(banner.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project.wires[0]?.locked).toBe(true);
  await user.click(banner.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.wires[0]?.locked).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Lock wire 0' }));
  unmount();
  mount();
  expect(screen.getByRole('button', { name: 'Unlock wire 0' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
});

it('refuses a protected deletion with an explanation and keeps the wire selected', async () => {
  const { user } = renderApp(buildLockedWiringProject());
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Delete wire 0' }));
  expect(loadProject().project).toEqual(before);
  expect(
    screen.getByText('Wire 0 is locked. Unlock it before changing this connection.'),
  ).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Find protecting wire 0' }));
  expect(screen.getByRole('button', { name: 'Unlock wire 0' })).toBe(document.activeElement);
});

it('refuses a mixed protected and free key deletion as one operation', async () => {
  const { user } = renderApp(buildLockedWiringProject());
  const before = loadProject().project;
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 2' }));
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
  expect(screen.getByRole('checkbox', { name: 'Select key 2' })).toHaveProperty('checked', true);
  fireEvent.keyDown(screen.getByRole('application'), { key: 'Delete', code: 'Delete' });
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
});

it('retains the mixed selection after the bulk delete button refuses and links to its protecting wire', async () => {
  const { user } = renderApp(buildLockedWiringProject());
  const before = loadProject().project;
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 2' }));
  await user.click(screen.getByRole('button', { name: 'Delete selected keys' }));
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
  expect(screen.getByRole('checkbox', { name: 'Select key 2' })).toHaveProperty('checked', true);
  await user.click(screen.getByRole('button', { name: 'Find protecting wire 0' }));
  expect(screen.getByRole('button', { name: 'Unlock wire 0' })).toBe(document.activeElement);
});
