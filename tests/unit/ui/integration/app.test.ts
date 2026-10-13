// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

it('commits a name once on Enter, cancels a draft, and restores persisted undo/redo after reload', async () => {
  const { user, unmount, mount } = renderApp();
  const before = loadProject().project;
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'My pad');
  expect(loadProject().project).toEqual(before);
  await user.keyboard('{Enter}');
  expect(loadProject().project.name).toBe('My pad');
  await user.clear(name);
  await user.type(name, 'Discard me{Escape}');
  expect(name).toHaveProperty('value', 'My pad');
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(loadProject().project.name).toBe('My pad');
  unmount();
  mount();
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveProperty('value', 'My pad');
});

it.each([
  ['Bindings', 'schematic'],
  ['Firmware', 'schematic'],
  ['Export', 'schematic'],
  ['Schematic', 'export'],
] as const)(
  'switches to %s with focus and preserves project data',
  async (name, activeWorkspaceId) => {
    const { user } = renderApp(undefined, { activeWorkspaceId });
    const before = loadProject().project;
    await user.click(
      within(screen.getByRole('navigation', { name: 'Workspaces' })).getByRole('button', { name }),
    );
    expect(document.activeElement).toBe(screen.getByRole('heading', { name, level: 1 }));
    expect(document.title).toBe(`${name} — ZMK Customizer`);
    expect(loadProject().project).toEqual(before);
  },
);

it('changes controller families, shows every dropped assignment, blocks export and recovers with undo', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Controller board' }),
    'seeeduino_xiao_ble',
  );
  const after = loadProject().project;
  expect(after.controllerId).toBe('seeeduino_xiao_ble');
  const assignedEnds = before.wires
    .flatMap((wire) => [wire.start, wire.end])
    .filter((end) => end.kind === 'free')
    .filter((end) => end.boardPin !== undefined);
  const droppedEnds = after.wires
    .flatMap((wire) => [wire.start, wire.end])
    .filter((end) => end.kind === 'free')
    .filter((end) => end.droppedBoardPin !== undefined);
  expect(droppedEnds).toHaveLength(assignedEnds.length);
  expect(
    after.wires
      .flatMap((wire) => [wire.start, wire.end])
      .filter((end) => end.kind === 'free')
      .some((end) => end.boardPin !== undefined),
  ).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Export' }));
  expect(
    screen.getByRole('button', { name: /^Download \.zip/u }).getAttribute('aria-disabled'),
  ).toBe('true');
  expect(screen.queryByRole('region', { name: 'Generated repository files' })).toBeNull();
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('region', { name: 'Generated repository files' })).toBeTruthy();
  expect(
    screen.getByRole('button', { name: /^Download \.zip/u }).getAttribute('aria-disabled'),
  ).toBeNull();
});

it('keeps compatible connector assignments and reports incompatible Bluetooth bindings on USB controllers', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Controller board' }),
    'adafruit_kb2040',
  );
  expect(loadProject().project.wires).toEqual(before.wires);
  await user.click(screen.getByRole('button', { name: 'Export' }));
  expect(screen.getByText(/uses Bluetooth, unavailable on Adafruit KB2040/u)).toBeTruthy();
  expect(
    screen.getByRole('button', { name: /^Download \.zip/u }).getAttribute('aria-disabled'),
  ).toBe('true');
});

it('reverses/removes a diode with real buttons, prevents a second diode and restores exact state', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const parts = screen.getByRole('region', { name: 'Parts' });
  const opposite = within(parts).getByRole('button', { name: 'Add diode at key 0 pin 2' });
  await user.click(opposite);
  expect(loadProject().project).toEqual(before);
  await user.click(within(parts).getByRole('button', { name: 'Reverse diode at key 0 pin 1' }));
  expect(loadProject().project.keys[0]?.diode?.cathode).not.toBe(before.keys[0]?.diode?.cathode);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  await user.click(within(parts).getByRole('button', { name: 'Remove diode at key 0 pin 1' }));
  expect(loadProject().project.keys[0]?.diode).toBeUndefined();
  await user.click(opposite);
  expect(loadProject().project.keys[0]?.diode?.pin).toBe(2);
});

it('updates a pin through its labeled picker and restores it with undo', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const picker = getDefinedValue(
    screen.getAllByRole('combobox', { name: /Wire \d+ (start|end) board pin/u })[0],
  );
  await user.selectOptions(picker, '');
  expect(loadProject().project.wires).not.toEqual(before.wires);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('deleting a key removes its bindings from all layers and connected wires; undo restores them', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const removedId = before.keys[0]?.id;
  await user.click(screen.getByRole('button', { name: 'Delete key 0' }));
  const after = loadProject().project;
  expect(after.keys).toHaveLength(before.keys.length - 1);
  for (const layer of after.layers) {
    expect(Object.keys(layer.bindings)).not.toContain(removedId);
  }
  expect(
    after.wires
      .flatMap((wire) => [wire.start, wire.end])
      .filter((end) => end.kind === 'key-pin')
      .some((end) => end.keyId === removedId),
  ).toBe(false);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('adds, renames, reorders and deletes a layer through the UI without shifting bindings', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Add layer' }));
  expect(loadProject().project.layers).toHaveLength(before.layers.length + 1);
  const name = screen.getByRole('textbox', { name: 'Layer name' });
  await user.clear(name);
  await user.type(name, 'Nav{Enter}');
  const added = loadProject().project.layers.at(-1);
  expect(added?.name).toBe('Nav');
  await user.click(screen.getByRole('button', { name: 'Move left' }));
  expect(loadProject().project.layers.at(-2)).toEqual(added);
  await user.click(screen.getByRole('button', { name: 'Delete layer' }));
  expect(loadProject().project.layers).toEqual(before.layers);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project.layers.at(-2)).toEqual(added);
});

it('toggles workflow files, copies the exact visible file and exposes clipboard failure with retry', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'export' });
  const workflow = screen.getByRole('checkbox', { name: 'Include GitHub Actions workflow' });
  expect(screen.getByText('.github/workflows/build.yml', { selector: 'summary' })).toBeTruthy();
  await user.click(workflow);
  expect(screen.queryByText('.github/workflows/build.yml', { selector: 'summary' })).toBeNull();
  await user.click(workflow);
  expect(screen.getByText('.github/workflows/build.yml', { selector: 'summary' })).toBeTruthy();
  const preview = screen.getByLabelText('config/west.yml');
  await user.click(screen.getByRole('button', { name: 'Copy config/west.yml' }));
  expect(await navigator.clipboard.readText()).toBe(preview.textContent);
  expect(screen.getByRole('status').textContent).toContain('Copied config/west.yml');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  await user.click(screen.getByRole('button', { name: 'Copy config/west.yml' }));
  await waitFor(() => {
    expect(screen.getByRole('status').textContent).toContain('Select the preview text');
  });
});

it('confirms replacement, cancels safely and starts an empty project with cleared history', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  const dialog = screen.getByRole('dialog', { name: 'Start a new project?' });
  expect(loadProject().project).toEqual(before);
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByRole('button', { name: 'Start new project' }));
  expect(loadProject().project.keys).toEqual([]);
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
});
