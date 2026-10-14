import { getKeyGeometry } from '@domain/geometry';
import { loadProject } from '@storage/project';
// @vitest-environment jsdom
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';

function project() {
  return buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } },
      { id: 'k1', xU: 4, yU: 2 },
    ],
    bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' } },
  });
}
async function edit(user: ReturnType<typeof renderApp>['user'], name: string, value: string) {
  if (screen.queryByRole('spinbutton', { name }) === null) {
    await user.click(screen.getByText('Precise properties'));
  }
  const field = screen.getByRole('spinbutton', { name });
  await user.clear(field);
  await user.type(field, `${value}{Enter}`);
}
function historyButton(name: string) {
  return within(screen.getByRole('banner')).getByRole('button', {
    name: new RegExp(`^${name}`, 'u'),
  });
}
it('edits all geometry via labeled fields, persists and renders equal sized/rotated caps in both workspaces', async () => {
  const { user, unmount, mount } = renderApp(project());
  const before = loadProject().project;
  await edit(user, 'Key 0 Width (u)', '2.25');
  await edit(user, 'Key 0 Height (u)', '1.5');
  await edit(user, 'Key 0 Rotation (°)', '30');
  await edit(user, 'Key 0 Origin X (u)', '1');
  await edit(user, 'Key 0 Origin Y (u)', '2');
  const saved = loadProject().project;
  expect(saved.keys[0]).toMatchObject({
    widthU: 2.25,
    heightU: 1.5,
    rotationDeg: 30,
    rotationOriginXU: 1,
    rotationOriginYU: 2,
    diode: before.keys[0]?.diode,
  });
  expect(saved.layers).toEqual(before.layers);
  const schematic = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  expect(schematic.querySelector('rect')?.getAttribute('width')).toBe('2.17');
  expect(schematic.getAttribute('transform')).toBe('rotate(30 1 2)');
  await user.click(screen.getByRole('button', { name: /^Bindings$/u }));
  const cap = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  expect(cap.querySelector('rect')?.getAttribute('width')).toBe('2.17');
  expect(cap.getAttribute('transform')).toBe('rotate(30 1 2)');
  unmount();
  mount();
  expect(loadProject().project).toEqual(saved);
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(saved);
});
it('previews a multi-key geometry edit without saving, cancels and applies with one undo step', async () => {
  const { user } = renderApp(project());
  const before = loadProject().project;
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  await edit(user, 'Selected width (u)', '1.5');
  await edit(user, 'Selected rotation (°)', '-15');
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('graphics-symbol', { name: /^Key 0\b/u }).getAttribute('transform')).toBe(
    'rotate(-15 0 0)',
  );
  await user.click(screen.getByRole('button', { name: 'Cancel preview' }));
  expect(loadProject().project).toEqual(before);
  await edit(user, 'Selected width (u)', '1.5');
  await edit(user, 'Selected rotation (°)', '-15');
  await user.click(screen.getByRole('button', { name: 'Apply layout' }));
  expect(loadProject().project.keys.map((key) => key.widthU)).toEqual([1.5, 1.5]);
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(before);
  await user.click(historyButton('Redo'));
  expect(loadProject().project.keys.map((key) => key.rotationDeg)).toEqual([-15, -15]);
});
it('duplicates selected layers and diode without wires, renumbers and deletes atomically with undo', async () => {
  const { user } = renderApp(project());
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Duplicate selected keys' }));
  const copied = loadProject().project;
  expect(copied.keys).toHaveLength(4);
  expect(copied.layers[0]?.bindings).toMatchObject({ k2: { kind: 'trans' }, k3: { kind: 'none' } });
  expect(copied.wires).toEqual(before.wires);
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  await edit(user, 'Key 0 Y (u)', '3');
  const moved = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Renumber by position' }));
  expect(loadProject().project.keys.map((key) => key.id)).toEqual(['k1', 'k0']);
  expect(loadProject().project.layers).toEqual(before.layers);
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(moved);
  await user.click(screen.getByRole('button', { name: 'Delete selected keys' }));
  expect(loadProject().project.keys).toHaveLength(0);
  expect(loadProject().project.layers[0]?.bindings).toEqual({});
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(moved);
});
it('nudges the complete selected rotated cluster and preserves origin, native field keys and redo on cancel', async () => {
  const initial = project();
  const { user } = renderApp({
    ...initial,
    keys: initial.keys.map((key) => ({
      id: key.id,
      xU: key.xU,
      yU: key.yU,
      rotationDeg: 15,
      rotationOriginXU: key.xU,
      rotationOriginYU: key.yU,
    })),
  });
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Select key 1' }));
  const before = loadProject().project;
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.focus(first);
  fireEvent.keyDown(first, { key: 'ArrowRight', code: 'ArrowRight', shiftKey: true });
  expect(loadProject().project.keys.map((key) => key.xU)).toEqual([0.25, 4.25]);
  expect(loadProject().project.keys.map((key) => key.rotationOriginXU)).toEqual([0.25, 4.25]);
  await user.click(historyButton('Undo'));
  expect(loadProject().project).toEqual(before);
  const width = screen.getByRole('spinbutton', { name: 'Key 0 Width (u)' });
  await user.clear(width);
  await user.type(width, '7{Escape}');
  await user.tab();
  expect(loadProject().project).toEqual(before);
  expect(historyButton('Redo')).toHaveProperty('disabled', false);
});

it('applies an explicitly entered first-key value to mixed selection and keeps table keyboard focus after deletion', async () => {
  const initial = project();
  const { user } = renderApp({
    ...initial,
    keys: [initial.keys[0], { id: 'k1', xU: 4, yU: 2, widthU: 2 }].filter(
      (key) => key !== undefined,
    ),
  });
  const first = screen.getByRole('checkbox', { name: 'Select key 0' });
  await user.click(first);
  await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
  expect(screen.getByRole('checkbox', { name: 'Select key 1' })).toHaveProperty('checked', true);
  await edit(user, 'Selected width (u)', '1');
  await user.click(screen.getByRole('button', { name: 'Apply layout' }));
  expect(loadProject().project.keys.map((key) => getKeyGeometry(key).widthU)).toEqual([1, 1]);
  await user.click(screen.getByRole('button', { name: 'Delete key 1' }));
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('tabIndex', 0);
});

it('extends canvas selection with Mod+Space without moving or saving keys', async () => {
  renderApp(project());
  const before = loadProject().project;
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.focus(first);
  fireEvent.keyDown(first, { key: ' ', code: 'Space', ctrlKey: true });
  fireEvent.keyDown(first, { key: ' ', code: 'Space', ctrlKey: true });
  fireEvent.keyDown(first, { key: 'ArrowRight', code: 'ArrowRight' });
  const second = screen.getByRole('graphics-symbol', { name: /^Key 1\b/u });
  await waitFor(() => {
    expect(document.activeElement).toBe(second);
  });
  fireEvent.keyDown(second, { key: ' ', code: 'Space', ctrlKey: true });
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
  expect(screen.getByRole('checkbox', { name: 'Select key 1' })).toHaveProperty('checked', true);
  expect(loadProject().project).toEqual(before);
});
