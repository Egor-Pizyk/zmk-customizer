// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

it('creates, assigns, edits, deletes and restores a shared behavior through real controls', async () => {
  const { user } = renderApp(undefined, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  await user.click(screen.getByText('Custom behaviors', { selector: 'summary' }));
  await user.type(screen.getByRole('textbox', { name: 'New behavior name' }), 'Home');
  await user.click(screen.getByRole('button', { name: 'Create behavior' }));
  expect(loadProject().project.behaviors[0]?.kind).toBe('hold-tap');
  await user.click(screen.getByText('Home', { selector: 'summary' }));
  const timing = screen.getByRole('spinbutton', { name: 'Tapping term (ms)' });
  await user.clear(timing);
  await user.type(timing, '250{Enter}');
  expect(loadProject().project.behaviors[0]).toMatchObject({ tappingTermMs: 250 });
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('button', { name: /^behavior:/u }));
  await user.type(
    screen.getByRole('searchbox', { name: 'Search by name, code or symbol' }),
    'Home',
  );
  await user.click(screen.getByRole('button', { name: 'Home' }));
  expect(loadProject().project.layers[0]?.bindings['k0']).toMatchObject({
    kind: 'custom',
    behaviorId: 'b0',
  });
  await user.click(screen.getByRole('button', { name: 'Delete behavior Home' }));
  expect(loadProject().project.behaviors).toEqual([]);
  expect(screen.getAllByText(/uses deleted behavior b0/u).length).toBeGreaterThan(0);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project.behaviors[0]).toMatchObject({ id: 'b0', tappingTermMs: 250 });
});

it('edits sticky flags, mod-morph modifiers and tap actions using typed controls', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  await user.click(screen.getByText('Custom behaviors', { selector: 'summary' }));
  await create('sticky-key', 'Sticky');
  await create('mod-morph', 'Morph');
  await create('tap-dance', 'Dance');
  await user.click(screen.getByText('Sticky', { selector: 'summary' }));
  await user.click(screen.getByRole('checkbox', { name: 'Lazy' }));
  await user.click(screen.getByRole('checkbox', { name: 'Quick release' }));
  await user.click(screen.getByRole('checkbox', { name: 'Ignore modifiers' }));
  const timeout = screen.getByRole('spinbutton', { name: 'Release timeout (ms)' });
  await user.clear(timeout);
  await user.type(timeout, '1400{Enter}');
  expect(loadProject().project.behaviors[0]).toMatchObject({
    lazy: true,
    quickRelease: true,
    ignoreModifiers: false,
    releaseAfterMs: 1400,
  });
  await user.click(screen.getByText('Sticky', { selector: 'summary' }));
  await user.click(screen.getByText('Morph', { selector: 'summary' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Normal action key' }), 'C');
  await user.selectOptions(screen.getByRole('listbox', { name: 'Trigger modifiers' }), [
    'LS',
    'RS',
  ]);
  await user.selectOptions(screen.getByRole('listbox', { name: 'Retained modifiers' }), ['RS']);
  expect(loadProject().project.behaviors[1]).toMatchObject({
    mods: ['LS', 'RS'],
    keepMods: ['RS'],
    normal: { kind: 'kp', key: { keycode: 'C' } },
  });
  await user.click(screen.getByText('Morph', { selector: 'summary' }));
  await user.click(screen.getByText('Dance', { selector: 'summary' }));
  await user.click(screen.getByRole('button', { name: 'Add tap action' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Tap 3 behavior' }), 'mo');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Tap 3 layer' }), 'l1');
  await user.click(screen.getByRole('button', { name: 'Remove tap 1' }));
  expect(loadProject().project.behaviors[2]).toMatchObject({
    bindings: [{ id: 'a1' }, { id: 'a2', binding: { kind: 'mo', layerId: 'l1' } }],
  });
  async function create(kind: string, name: string) {
    await user.selectOptions(screen.getByRole('combobox', { name: 'Behavior type' }), kind);
    await user.type(screen.getByRole('textbox', { name: 'New behavior name' }), name);
    await user.click(screen.getByRole('button', { name: 'Create behavior' }));
  }
});
