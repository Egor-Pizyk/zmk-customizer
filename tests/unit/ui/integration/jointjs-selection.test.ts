// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { buildProject, keyPin, freeEnd } from '../../../helpers/build-project';
import { addWire } from '@domain/wires/editing';
import { getNets } from '@domain/wires/nets';
import { loadProject } from '@storage/project';

it('preserves native field Delete and removes the exact mixed selection atomically', async () => {
  const row = addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: 0 },
        { id: 'k3', xU: 4, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
  const source = {
    ...row,
    wires: [...row.wires, { id: 'w2', start: freeEnd(0, 4), end: freeEnd(4, 4), bends: [] }],
  };
  const { user } = renderApp(source);
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.keyboard('{Delete}');
  expect(loadProject().project).toEqual(source);
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
  await user.click(screen.getByRole('checkbox', { name: /^Section 3, w2:/u }));
  await user.keyboard('{Delete}');
  const after = loadProject().project;
  expect(after.keys.map((key) => key.id)).toEqual(['k2', 'k3']);
  expect(after.wires.some((wire) => wire.id === 'w2')).toBe(false);
  expect(getNets(after).map((net) => net.pins)).toContainEqual([
    { keyId: 'k2', pin: 1 },
    { keyId: 'k3', pin: 1 },
  ]);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(after);
  expect(document.querySelectorAll('.joint-paper')).toHaveLength(1);
});
