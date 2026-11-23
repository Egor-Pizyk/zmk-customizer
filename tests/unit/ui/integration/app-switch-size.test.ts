// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { buildProject } from '../../../helpers/build-project';
import { renderApp } from '../../../helpers/render-app';

it('offers rotation but no switch sizing in Schematic and preserves imported dimensions', async () => {
  const initial = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 2.25, heightU: 1.5 }] });
  const { user } = renderApp(initial);
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  expect(screen.queryAllByRole('button', { name: /^Resize key/u })).toHaveLength(0);
  expect(screen.getAllByRole('button', { name: /^Rotate key 0/u })).toHaveLength(1);
  expect(screen.queryAllByRole('spinbutton', { name: /width|height/iu })).toHaveLength(0);
  expect(screen.queryByText('Precise properties')).toBeNull();
  expect(screen.getByRole('spinbutton', { name: 'Key 0 Rotation (°)' })).toBeTruthy();
  expect(loadProject().project).toEqual(initial);
});

it('discards numeric Escape drafts before committing another key property', async () => {
  const initial = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(initial);
  const rotation = screen.getByRole('spinbutton', { name: 'Key 0 Rotation (°)' });
  await user.clear(rotation);
  await user.type(rotation, '25');
  expect(loadProject().project).toEqual(initial);
  await user.keyboard('{Escape}');
  expect(rotation.getAttribute('value')).toBe('0');
  const x = screen.getByRole('spinbutton', { name: 'Key 0 X (u)' });
  await user.clear(x);
  await user.type(x, '2{Enter}');
  expect(loadProject().project.keys[0]).toMatchObject({ xU: 2, yU: 0 });
  expect(loadProject().project.keys[0]?.rotationDeg).toBeUndefined();
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(initial);
});
