// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

function history(name: 'Undo' | 'Redo') {
  return within(screen.getByRole('banner')).getByRole('button', {
    name: new RegExp(`^${name}`, 'u'),
  });
}
it('edits encoder hardware/actions, preserves layers and restores deletion in one undo', async () => {
  const { user } = renderApp();
  await user.click(screen.getByText('Encoders', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Add encoder' }));
  await user.selectOptions(screen.getByLabelText('Encoder 0 A pin'), '20');
  await user.selectOptions(screen.getByLabelText('Encoder 0 B pin'), '21');
  const x = screen.getByRole('spinbutton', { name: 'Encoder 0 X (u)' });
  await user.clear(x);
  await user.type(x, '7{Enter}');
  expect(loadProject().project.encoders[0]).toMatchObject({ xU: 7, aPin: 20, bPin: 21 });
  await user.click(history('Undo'));
  expect(loadProject().project.encoders[0]?.xU).toBe(6);
  await user.click(history('Redo'));
  await user.click(screen.getByRole('button', { name: /^Bindings(?:,|$)/u }));
  await user.click(screen.getByText('Encoder actions', { exact: true }));
  await user.selectOptions(screen.getByLabelText('Encoder 0 clockwise behavior'), 'kp');
  await user.selectOptions(screen.getByLabelText('Encoder 0 clockwise key'), 'C_VOLUME_UP');
  await user.click(screen.getByRole('tab', { name: /1 Fn/u }));
  await user.selectOptions(screen.getByLabelText('Encoder 0 counterclockwise behavior'), 'kp');
  await user.selectOptions(screen.getByLabelText('Encoder 0 counterclockwise key'), 'PAGE_DOWN');
  const before = loadProject().project;
  expect(before.layers[0]?.encoderBindings?.['e1']?.clockwise).toMatchObject({
    kind: 'kp',
    key: { keycode: 'C_VOLUME_UP' },
  });
  expect(before.layers[1]?.encoderBindings?.['e1']?.counterclockwise).toMatchObject({
    kind: 'kp',
    key: { keycode: 'PAGE_DOWN' },
  });
  await user.click(screen.getByRole('button', { name: /^Schematic(?:,|$)/u }));
  await user.click(screen.getByText('Encoders', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Delete encoder 0' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add encoder' }));
  expect(loadProject().project.encoders).toEqual([]);
  await user.click(history('Undo'));
  expect(loadProject().project).toEqual(before);
});
it('routes pin problems from Export to a revealed repair select and clears them', async () => {
  const { user } = renderApp();
  await user.click(screen.getByText('Encoders', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Add encoder' }));
  await user.click(screen.getByRole('button', { name: /^Export(?:,|$)/u }));
  await user.click(screen.getByRole('button', { name: /Schematic: Encoder 0: assign A/u }));
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByLabelText('Encoder 0 A pin'));
  });
  await user.selectOptions(screen.getByLabelText('Encoder 0 A pin'), '20');
  await user.selectOptions(screen.getByLabelText('Encoder 0 B pin'), '21');
  await user.click(screen.getByRole('button', { name: /^Export(?:,|$)/u }));
  expect(
    screen.getByRole('button', { name: 'Download .zip' }).getAttribute('aria-disabled'),
  ).not.toBe('true');
});
