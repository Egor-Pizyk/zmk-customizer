import { loadProject } from '@storage/project';
import { loadPreferences } from '@storage/preferences';
// @vitest-environment jsdom
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';

function simpleProject() {
  return buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 3, yU: 0 },
    ],
  });
}

function preparePointerCapture() {
  // jsdom cannot capture an OS pointer; event dispatch still follows the real React path.
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    configurable: true,
    value() {
      // Pointer events are explicitly delivered to the canvas by the test.
    },
  });
}

it('previews a snapped key drag, commits only on release, cancels safely and rejects overlap', async () => {
  const { user } = renderApp(simpleProject());
  preparePointerCapture();
  const before = loadProject().project;
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  const key = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.pointerDown(key, { button: 0, pointerId: 1, clientX: 24, clientY: 24 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 88, clientY: 24 });
  expect(loadProject().project).toEqual(before);
  fireEvent.pointerCancel(canvas, { pointerId: 1 });
  expect(loadProject().project).toEqual(before);
  fireEvent.pointerDown(key, { button: 0, pointerId: 2, clientX: 24, clientY: 24 });
  fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 88, clientY: 24 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 2 });
  expect(loadProject().project.keys[0]?.xU).toBe(1.25);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  fireEvent.pointerDown(key, { button: 0, pointerId: 3, clientX: 24, clientY: 24 });
  fireEvent.pointerMove(canvas, { pointerId: 3, clientX: 168, clientY: 24 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 3 });
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('status').textContent).toContain('already a key here');
});

it('places keys with the Key tool, rejects overlap, and keyboard deletion returns focus to the next key', async () => {
  const { user } = renderApp(simpleProject());
  preparePointerCapture();
  const before = loadProject().project;
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  await user.click(screen.getByRole('radio', { name: /^Key/u }));
  fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 24, clientY: 24 });
  expect(loadProject().project).toEqual(before);
  fireEvent.pointerDown(canvas, { button: 0, pointerId: 2, clientX: 312, clientY: 24 });
  expect(loadProject().project.keys).toHaveLength(3);
  expect(loadProject().project.keys[2]).toMatchObject({ xU: 6, yU: 0 });
  fireEvent.keyDown(canvas, { key: 'v', code: 'KeyV' });
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.focus(first);
  fireEvent.keyDown(first, { key: 'Delete', code: 'Delete' });
  expect(loadProject().project.keys).toHaveLength(2);
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByRole('graphics-symbol', { name: /^Key 0\b/u }));
  });
});

it('canvas keyboard arrows move focus, Shift+Arrow nudges by the grid and undo restores geometry', async () => {
  const { user } = renderApp(simpleProject());
  const before = loadProject().project;
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.focus(first);
  fireEvent.keyDown(first, { key: 'ArrowRight', code: 'ArrowRight' });
  const second = screen.getByRole('graphics-symbol', { name: /^Key 1\b/u });
  await waitFor(() => {
    expect(document.activeElement).toBe(second);
  });
  fireEvent.keyDown(second, { key: 'ArrowRight', code: 'ArrowRight', shiftKey: true });
  expect(loadProject().project.keys[1]?.xU).toBe(3.25);
  expect(loadPreferences().preferences.viewByWorkspace.schematic.panXPx).toBe(0);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('pans and zooms the viewport without changing the keyboard, including a wheel draft followed by workspace switch', async () => {
  const { user } = renderApp(simpleProject());
  const before = loadProject().project;
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  fireEvent.wheel(canvas, { deltaX: 12, deltaY: 24 });
  await user.click(screen.getByRole('button', { name: 'Export' }));
  expect(loadPreferences().preferences.viewByWorkspace.schematic).toMatchObject({
    panXPx: -12,
    panYPx: -24,
    zoom: 1,
  });
  await user.click(
    within(screen.getByRole('navigation', { name: 'Workspaces' })).getByRole('button', {
      name: /^Schematic/u,
    }),
  );
  fireEvent.wheel(screen.getByRole('application'), {
    deltaY: -120,
    ctrlKey: true,
    clientX: 100,
    clientY: 100,
  });
  await waitFor(() => {
    expect(loadPreferences().preferences.viewByWorkspace.schematic.zoom).toBeGreaterThan(1);
  });
  expect(loadProject().project).toEqual(before);
});

it('Bindings pointer selection and keyboard navigation never change key geometry or bindings', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'bindings' });
  const before = loadProject().project;
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  const second = screen.getByRole('graphics-symbol', { name: /^Key 1\b/u });
  fireEvent.pointerDown(first, { button: 0, pointerId: 1 });
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', true);
  fireEvent.pointerDown(second, { button: 0, pointerId: 2, ctrlKey: true });
  expect(screen.getByRole('checkbox', { name: 'Select key 1' })).toHaveProperty('checked', true);
  fireEvent.focus(first);
  fireEvent.keyDown(first, { key: 'End', code: 'End' });
  expect(document.activeElement).toBe(screen.getByRole('graphics-symbol', { name: /^Key 5\b/u }));
  fireEvent.keyDown(getDefinedValue(document.activeElement), { key: 'Home', code: 'Home' });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: 'Escape', code: 'Escape' });
  expect(screen.getByRole('checkbox', { name: 'Select key 0' })).toHaveProperty('checked', false);
  await user.click(
    within(screen.getByRole('navigation', { name: 'Workspaces' })).getByRole('button', {
      name: /^Schematic/u,
    }),
  );
  expect(loadProject().project).toEqual(before);
});

it('marquee-selects several keys, moves them together and deletes them in one undoable action', async () => {
  const { user } = renderApp(simpleProject());
  preparePointerCapture();
  const before = loadProject().project;
  const canvas = screen.getByRole('application');
  fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: -12, clientY: -12 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 220, clientY: 70 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 1 });
  const first = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  expect(first.getAttribute('aria-label')).toContain('selected');
  expect(
    screen.getByRole('graphics-symbol', { name: /^Key 1\b/u }).getAttribute('aria-label'),
  ).toContain('selected');
  fireEvent.pointerDown(first, { button: 0, pointerId: 2, clientX: 24, clientY: 24 });
  fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 84, clientY: 24 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 2 });
  expect(loadProject().project.keys.map((key) => key.xU)).toEqual([1.25, 4.25]);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  fireEvent.keyDown(canvas, { key: 'Delete', code: 'Delete' });
  expect(loadProject().project.keys).toHaveLength(0);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('middle-button pan commits the viewport once without moving or selecting keys', () => {
  renderApp(simpleProject());
  preparePointerCapture();
  const before = loadProject().project;
  const canvas = screen.getByRole('application');
  fireEvent.pointerDown(canvas, { button: 1, pointerId: 1, clientX: 10, clientY: 20 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 70 });
  expect(loadPreferences().preferences.viewByWorkspace.schematic.panXPx).toBe(0);
  fireEvent.pointerUp(canvas, { button: 1, pointerId: 1 });
  expect(loadPreferences().preferences.viewByWorkspace.schematic).toMatchObject({
    panXPx: 30,
    panYPx: 50,
  });
  expect(loadProject().project).toEqual(before);
});

it('keeps Redo and avoids autosave when a pointer drag ends at its original position', async () => {
  const { user } = renderApp(simpleProject());
  preparePointerCapture();
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited{Enter}');
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  const before = loadProject().project;
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  const key = screen.getByRole('graphics-symbol', { name: /^Key 0\b/u });
  fireEvent.pointerDown(key, { button: 0, pointerId: 1, clientX: 24, clientY: 24 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 1, clientX: 24, clientY: 24 });
  expect(write).not.toHaveBeenCalled();
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.name).toBe('Edited');
});

it('cancels an in-progress wire without saving and commits a completed wire', async () => {
  const { user } = renderApp(simpleProject());
  preparePointerCapture();
  const before = loadProject().project;
  const canvas = screen.getByRole('application', { name: /^Schematic canvas/u });
  await user.click(screen.getByRole('radio', { name: /^Wire/u }));
  fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 14.4, clientY: 17.6 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.keyDown(canvas, { key: 'Escape', code: 'Escape' });
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('radio', { name: /^Wire/u }));
  fireEvent.pointerDown(getDefinedValue(canvas.querySelector('[data-key-id="k1"][data-pin="1"]')), {
    button: 0,
    pointerId: 2,
    clientX: 14.4,
    clientY: 17.6,
  });
  fireEvent.pointerDown(getDefinedValue(canvas.querySelector('[data-key-id="k2"][data-pin="1"]')), {
    button: 0,
    pointerId: 2,
    clientX: 158.4,
    clientY: 17.6,
  });
  expect(loadProject().project.wires).toHaveLength(1);
  expect(loadProject().project.wires[0]?.start).toEqual({ kind: 'key-pin', keyId: 'k1', pin: 1 });
  expect(loadProject().project.wires[0]?.end).toEqual({ kind: 'key-pin', keyId: 'k2', pin: 1 });
});

it('keeps saved bends and Redo when committing an unchanged bend coordinate', async () => {
  const project = {
    ...simpleProject(),
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin' as const, keyId: 'k1', pin: 1 as const },
        end: { kind: 'key-pin' as const, keyId: 'k2', pin: 1 as const },
        bends: [{ xU: 1, yU: 1 }],
      },
    ],
  };
  const { user } = renderApp(project);
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited{Enter}');
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  const before = loadProject().project;
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const bend = screen.getByRole('spinbutton', { name: 'Wire 0 bend 0 X (u)' });
  await user.clear(bend);
  await user.type(bend, '1{Enter}');
  expect(write).not.toHaveBeenCalled();
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.name).toBe('Edited');
});
