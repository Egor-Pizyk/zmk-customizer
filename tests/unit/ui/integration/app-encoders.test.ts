import { getDefinedValue } from '../../../helpers/defined-value';
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
  await user.click(screen.getByRole('checkbox', { name: 'Encoder 0 schematic wiring' }));
  await user.click(screen.getByRole('checkbox', { name: 'Encoder 0 push switch' }));
  await user.selectOptions(screen.getByLabelText('Encoder 0 A pin'), '20');
  await user.selectOptions(screen.getByLabelText('Encoder 0 B pin'), '21');
  const previousX = loadProject().project.encoders[0]?.xU;
  const x = screen.getByRole('spinbutton', { name: 'Encoder 0 X (u)' });
  await user.clear(x);
  await user.type(x, '7{Enter}');
  expect(loadProject().project.encoders[0]).toMatchObject({ xU: 7, aPin: 20, bPin: 21 });
  await user.click(history('Undo'));
  expect(loadProject().project.encoders[0]?.xU).toBe(previousX);
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
  await user.click(screen.getByRole('checkbox', { name: 'Encoder 0 schematic wiring' }));
  await user.click(screen.getByRole('checkbox', { name: 'Encoder 0 push switch' }));
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

it('places a push-enabled encoder and edits its shared geometry through labeled controls', async () => {
  const { user } = renderApp();
  await user.click(screen.getByText('Encoders', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Add encoder' }));
  const encoder = loadProject().project.encoders[0];
  expect(encoder).toMatchObject({ wiringMode: 'schematic' });
  expect(encoder?.pushKeyId).toBeDefined();
  expect(screen.getByRole('checkbox', { name: 'Encoder 0 push switch' })).toHaveProperty(
    'checked',
    true,
  );
  const rotation = screen.getByRole('spinbutton', { name: 'Encoder 0 Rotation (°)' });
  await user.clear(rotation);
  await user.type(rotation, '90{Enter}');
  const project = loadProject().project;
  expect(project.keys.find((key) => key.id === encoder?.pushKeyId)?.rotationDeg).toBe(90);
  await user.click(screen.getByRole('checkbox', { name: 'Encoder 0 push switch' }));
  expect(loadProject().project.keys.some((key) => key.id === encoder?.pushKeyId)).toBe(false);
  await user.click(history('Undo'));
  expect(loadProject().project.keys.some((key) => key.id === encoder?.pushKeyId)).toBe(true);
});
it('reveals schematic contact issues at the labeled wiring control', async () => {
  const { user } = renderApp();
  await user.click(screen.getByText('Encoders', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Add encoder' }));
  await user.click(screen.getByRole('button', { name: /^Export(?:,|$)/u }));
  await user.click(
    screen.getByRole('button', { name: /Schematic: Encoder 0: connect A through a wire/u }),
  );
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Encoder 0 schematic wiring' }),
    );
  });
  const wiring = screen.getByRole('checkbox', { name: 'Encoder 0 schematic wiring' });
  expect(wiring.getAttribute('aria-invalid')).toBe('true');
  expect(wiring.getAttribute('aria-describedby')).toBeTruthy();
  expect(screen.getByText(/Encoder 0: connect COM to GND on the same half\./u)).toBeDefined();
});

it('groups Keys and Encoders under Parts with independent folds and unchanged history', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const parts = screen.getByRole('heading', { name: 'Parts' }).closest('section');
  const group = within(getDefinedValue(parts));
  const keys = getDefinedValue(
    group.getByRole('heading', { name: 'Keys', level: 3 }).closest('details'),
  );
  const encoders = getDefinedValue(
    group.getByRole('heading', { name: 'Encoders', level: 3 }).closest('details'),
  );
  expect(keys).toHaveProperty('open', true);
  expect(encoders).toHaveProperty('open', false);
  await user.click(group.getByText('Keys', { exact: true }));
  expect(keys).toHaveProperty('open', false);
  await user.click(group.getByText('Encoders', { exact: true }));
  expect(group.getByRole('button', { name: 'Add encoder' })).toBeTruthy();
  expect(keys).toHaveProperty('open', false);
  expect(loadProject().project).toEqual(before);
  await user.click(group.getByRole('button', { name: 'Add encoder' }));
  const added = loadProject().project;
  expect(added.encoders).toHaveLength(1);
  expect(keys).toHaveProperty('open', false);
  await user.click(group.getByText('Keys', { exact: true }));
  expect(group.getByRole('button', { name: 'Add encoder' })).toBeTruthy();
  await user.click(group.getByText('Encoders', { exact: true }));
  expect(encoders).toHaveProperty('open', false);
  expect(group.getByRole('button', { name: 'Add key' })).toBeTruthy();
  expect(loadProject().project).toEqual(added);
  await user.click(history('Undo'));
  expect(loadProject().project).toEqual(before);
  await user.click(history('Redo'));
  expect(loadProject().project).toEqual(added);
});
