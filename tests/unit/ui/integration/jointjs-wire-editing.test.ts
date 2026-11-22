// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('uses the real provider to preserve a drawn pass-through contact and exact wire history', async () => {
  const source = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 2, yU: 0 },
      { id: 'k3', xU: 4, yU: 0 },
    ],
  });
  const { user } = renderApp(source);
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(1);
  await user.selectOptions(screen.getByRole('combobox', { name: 'From' }), 'pin:k1:1');
  await user.selectOptions(screen.getByRole('combobox', { name: 'To' }), 'pin:k3:1');
  await user.click(screen.getByRole('button', { name: 'Add wire' }));
  const wired = loadProject().project;
  expect(wired.wires[0]?.contacts).toEqual([{ keyId: 'k2', pin: 1, at: { xU: 2.3, yU: 0.3667 } }]);
  expect(wired.keys).toEqual(source.keys);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(wired);
});
