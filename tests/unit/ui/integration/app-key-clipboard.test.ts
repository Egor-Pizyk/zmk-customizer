// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

function project() {
  return buildProject({
    keys: [
      { id: 'k0', xU: 1, yU: 2 },
      { id: 'k1', xU: 5, yU: 2 },
    ],
    layers: [
      { id: 'l0', name: 'Base', bindings: { k0: { kind: 'trans' } } },
      { id: 'l1', name: 'Nav', bindings: { k0: { kind: 'none' } } },
    ],
  });
}

it('copies a key snapshot, survives source deletion, and pastes all layers in one undo step', async () => {
  const { user } = renderApp(project());
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  screen.getByRole('application').focus();
  await user.keyboard('{Control>}c{/Control}');
  expect(screen.getByRole('status').textContent).toContain('Copied 1 keys');
  await user.keyboard('{Delete}');
  const deleted = loadProject().project;
  expect(deleted.keys.map((key) => key.id)).toEqual(['k1']);
  screen.getByRole('application').focus();
  await user.keyboard('{Control>}v{/Control}');
  const pasted = loadProject().project;
  expect(pasted.keys).toHaveLength(2);
  const copy = getDefinedValue(pasted.keys[1]);
  expect(copy).toMatchObject({ xU: 7, yU: 2 });
  expect(pasted.layers[0]?.bindings[copy.id]).toEqual({ kind: 'trans' });
  expect(pasted.layers[1]?.bindings[copy.id]).toEqual({ kind: 'none' });
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(deleted);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(pasted);
});

it('announces empty copy/paste and preserves native fields without layout controls', async () => {
  const before = project();
  const { user } = renderApp(before);
  const canvas = screen.getByRole('application');
  canvas.focus();
  await user.keyboard('{Control>}v{/Control}');
  expect(screen.getByRole('status').textContent).toContain('Copy ordinary keys');
  await user.keyboard('{Control>}c{/Control}');
  expect(screen.getByRole('status').textContent).toContain('Select ordinary keys');
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  canvas.focus();
  await user.keyboard('{Meta>}c{/Meta}');
  await user.click(screen.getByRole('textbox', { name: 'Name' }));
  await user.keyboard('{Control>}v{/Control}');
  expect(loadProject().project.keys).toEqual(before.keys);
  canvas.focus();
  await user.keyboard('{Meta>}v{/Meta}');
  expect(loadProject().project.keys).toHaveLength(3);
});
