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
  await user.click(screen.getByText('Precise properties'));
  expect(screen.queryAllByRole('spinbutton', { name: /width|height/iu })).toHaveLength(0);
  expect(screen.getByRole('spinbutton', { name: 'Selected rotation (°)' })).toBeTruthy();
  expect(screen.getByRole('spinbutton', { name: 'Key 0 Rotation (°)' })).toBeTruthy();
  expect(loadProject().project).toEqual(initial);
});
