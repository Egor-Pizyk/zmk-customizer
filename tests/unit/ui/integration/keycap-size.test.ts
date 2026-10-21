// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';

const initial = buildProject({
  keys: [
    { id: 'k0', xU: 0, yU: 0, widthU: 1.37, heightU: 1.5 },
    { id: 'k1', xU: 4, yU: 0 },
  ],
  bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' } },
});

it('shows custom geometry without changing it, then applies a catalog size with one history step', async () => {
  const { user } = renderApp(initial);
  await user.click(screen.getByRole('button', { name: 'Bindings' }));
  const key = screen.getByRole('graphics-symbol', { name: /^Key 0,/u });
  fireEvent.contextMenu(key);
  const dialog = screen.getByRole('dialog', { name: 'Keycap size' });
  expect(within(dialog).getByText('Custom: 1.37 × 1.5 u')).toBeDefined();
  expect(loadProject().project).toEqual(initial);
  await user.click(within(dialog).getByRole('button', { name: '2 × 1 u' }));
  const after = loadProject().project;
  expect(after.keys[0]).toMatchObject({ yU: 0.25, widthU: 2, heightU: 1 });
  expect(after.keys[0]?.xU).toBeCloseTo(-0.315, 12);
  expect(after.layers).toEqual(initial.layers);
  const banner = within(screen.getByRole('banner'));
  await user.click(banner.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(initial);
  await user.click(banner.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(after);
  fireEvent.keyDown(key, { key: 'ContextMenu', code: 'ContextMenu' });
  const currentDialog = screen.getByRole('dialog', { name: 'Keycap size' });
  expect(
    within(currentDialog)
      .getByRole('button', { name: '2 × 1 u — Current' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
  await user.click(within(currentDialog).getByRole('button', { name: '2 × 1 u — Current' }));
  await user.click(banner.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(initial);
});

it('shares group selection with the table and cancels without changes', async () => {
  const { user } = renderApp(initial);
  await user.click(screen.getByRole('button', { name: 'Bindings' }));
  await user.click(screen.getByText('Keys', { exact: true }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  const opener = screen.getByRole('button', { name: 'Keycap size for key 0' });
  await user.click(opener);
  let dialog = screen.getByRole('dialog', { name: 'Keycap size' });
  expect(within(dialog).getByText('Mixed sizes')).toBeDefined();
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(loadProject().project).toEqual(initial);
  await user.click(opener);
  dialog = screen.getByRole('dialog', { name: 'Keycap size' });
  await user.click(within(dialog).getByRole('button', { name: '1.5 × 1 u' }));
  expect(loadProject().project.keys.map((entry) => entry.widthU)).toEqual([1.5, 1.5]);
});
