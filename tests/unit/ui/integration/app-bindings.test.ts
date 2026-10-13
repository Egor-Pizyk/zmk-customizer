// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

it('searches and changes a key through the Action panel, shows the new legend and supports undo', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 0' }));
  await user.click(screen.getByRole('button', { name: /^key:/u }));
  const search = screen.getByRole('searchbox', { name: 'Search by name, code or symbol' });
  await user.type(search, 'SPACE');
  await user.keyboard('{Enter}');
  expect(loadProject().project.layers[0]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'SPACE', modifiers: [] },
  });
  expect(screen.getByRole('button', { name: 'key: SPACE' })).toBeTruthy();
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('copies an action and pastes to multiple keys in one undo step without changing another layer', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 0' }));
  const panel = screen.getByRole('complementary', { name: 'Action' });
  await user.click(within(panel).getByText('Copy', { selector: 'button' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 2' }));
  await user.click(within(panel).getByText('Paste', { selector: 'button' }));
  const after = loadProject().project;
  expect(after.layers[0]?.bindings['k1']).toEqual(before.layers[0]?.bindings['k0']);
  expect(after.layers[0]?.bindings['k2']).toEqual(before.layers[0]?.bindings['k0']);
  expect(after.layers[1]).toEqual(before.layers[1]);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('reserves a copied deleted layer target and never silently retargets it when another layer is added', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const before = loadProject().project;
  const targetId = before.layers[1]?.id;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 5' }));
  await user.click(
    within(screen.getByRole('complementary', { name: 'Action' })).getByText('Copy', {
      selector: 'button',
    }),
  );
  await user.click(screen.getByRole('tab', { name: '1 Fn' }));
  await user.click(screen.getByRole('button', { name: 'Delete layer' }));
  await user.click(screen.getByRole('button', { name: 'Add layer' }));
  expect(loadProject().project.layers.at(-1)?.id).not.toBe(targetId);
  await user.click(getDefinedValue(screen.getAllByRole('tab')[0]));
  await user.click(screen.getByRole('button', { name: 'Choose action for key 1' }));
  await user.click(
    within(screen.getByRole('complementary', { name: 'Action' })).getByText('Paste', {
      selector: 'button',
    }),
  );
  expect(loadProject().project.layers[0]?.bindings['k1']).toEqual(before.layers[0]?.bindings['k5']);
  expect(screen.getByRole('button', { name: /^Bindings,/u }).textContent).toContain('Bindings');
});

it('moves through layer tabs by keyboard with one tab stop and keeps each layer’s own actions', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const tabs = screen.getAllByRole('tab');
  await user.click(getDefinedValue(tabs[0]));
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(tabs[1]);
  expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
  expect(tabs[0]?.tabIndex).toBe(-1);
  expect(screen.getByRole('columnheader', { name: 'Action (Fn)' })).toBeTruthy();
  await user.keyboard('{Home}');
  expect(document.activeElement).toBe(tabs[0]);
  expect(screen.getByRole('columnheader', { name: 'Action (Base)' })).toBeTruthy();
  await user.keyboard('{ArrowLeft}');
  expect(document.activeElement).toBe(tabs[1]);
});

it('extends table selection with Shift+Arrow and uses Space to toggle without editing bindings', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const before = loadProject().project;
  const first = screen.getByRole('checkbox', { name: 'Select key 0' });
  await user.click(first);
  await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
  const second = screen.getByRole('checkbox', { name: 'Select key 1' });
  expect(document.activeElement).toBe(second);
  expect(first).toHaveProperty('checked', true);
  expect(second).toHaveProperty('checked', true);
  await user.keyboard(' ');
  expect(second).toHaveProperty('checked', false);
  expect(loadProject().project).toEqual(before);
});

it('leaves project unchanged when a search has no match and returns focus from the picker on Escape', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Choose action for key 0' }));
  const search = screen.getByRole('searchbox', { name: 'Search by name, code or symbol' });
  await user.type(search, 'no-such-keycode-xyz{Enter}');
  expect(screen.getByText(/Nothing matches/u)).toBeTruthy();
  expect(loadProject().project).toEqual(before);
  await user.keyboard('{Escape}');
  await waitFor(() => {
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/Key 0/u);
  });
});
