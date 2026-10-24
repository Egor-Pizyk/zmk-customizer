import { getExportPreview } from '@ui/export/logic';
import { getProjectAnalysis } from '@ui/project/logic';
import { loadProject } from '@storage/project';
// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';
import { renderApp } from '../../../helpers/render-app';

function project() {
  return buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 5, yU: 0 },
    ],
    bindings: { k0: { kind: 'trans' } },
  });
}
function capture() {
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    configurable: true,
    value() {
      /* jsdom pointer dispatch uses the real SVG handler. */
    },
  });
}
function history(name: string) {
  return within(screen.getByRole('banner')).getByRole('button', {
    name: new RegExp(`^${name}`, 'u'),
  });
}
it('rotates from an exterior corner about the center and cancels subsequent rotation without saving', async () => {
  const { user } = renderApp(project());
  capture();
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  const before = loadProject().project;
  const canvas = screen.getByRole('application');
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Rotate key 0 bottom right' }), {
    button: 0,
    pointerId: 2,
    clientX: 68,
    clientY: 68,
  });
  fireEvent.pointerMove(canvas, { pointerId: 2, clientX: -20, clientY: 68 });
  expect(screen.getByRole('graphics-symbol', { name: /^Key 0\b/u }).getAttribute('transform')).toBe(
    'rotate(90 0.5 0.5)',
  );
  expect(loadProject().project).toEqual(before);
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 2, clientX: -20, clientY: 68 });
  const rotated = loadProject().project;
  expect(rotated.keys[0]).toMatchObject({
    rotationDeg: 90,
    rotationOriginXU: 0.5,
    rotationOriginYU: 0.5,
  });
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Rotate key 0 bottom right' }), {
    button: 0,
    pointerId: 3,
    clientX: 0,
    clientY: 48,
  });
  fireEvent.pointerMove(canvas, { pointerId: 3, clientX: -48, clientY: 96 });
  fireEvent.keyDown(canvas, { key: 'Escape', code: 'Escape' });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 3 });
  expect(loadProject().project).toEqual(rotated);
  await user.click(history('Undo'));
  expect(loadProject().project).toEqual(before);
});
it('shows numeric changes immediately in the collapsed precise editor without a Preview button', async () => {
  const { user } = renderApp(project());
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  expect(screen.queryByRole('spinbutton', { name: 'Selected rotation (°)' })).toBeNull();
  await user.click(screen.getByText('Precise properties'));
  const before = loadProject().project;
  const rotation = screen.getByRole('spinbutton', { name: 'Selected rotation (°)' });
  await user.clear(rotation);
  await user.type(rotation, '2{Enter}');
  expect(screen.getByRole('graphics-symbol', { name: /^Key 0\b/u }).getAttribute('transform')).toBe(
    'rotate(2 0.5 0.5)',
  );
  expect(loadProject().project).toEqual(before);
  expect(screen.queryByRole('button', { name: 'Preview layout' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Apply layout' }));
  expect(loadProject().project.keys[0]?.rotationDeg).toBe(2);
});

it('exports the geometry produced by pointer gestures and preserves wiring, diode and bindings', async () => {
  const initial = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 2, diode: { pin: 1, cathode: 'away-switch' } }],
    wires: [
      { id: 'w0', start: keyPin('k0', 1), end: freeEnd(-2, 0.3667, 2), bends: [] },
      { id: 'w1', start: keyPin('k0', 2), end: freeEnd(3, 0.2333, 8), bends: [] },
    ],
    bindings: { k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
  });
  const { user } = renderApp(initial);
  capture();
  await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
  const canvas = screen.getByRole('application');
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Rotate key 0 bottom right' }), {
    button: 0,
    pointerId: 8,
    clientX: 116,
    clientY: 68,
  });
  fireEvent.pointerMove(canvas, { pointerId: 8, clientX: 4, clientY: 92 });
  fireEvent.pointerUp(canvas, { button: 0, pointerId: 8, clientX: 4, clientY: 92 });
  const saved = loadProject().project;
  expect(saved.wires).toEqual(initial.wires);
  expect(saved.layers).toEqual(initial.layers);
  expect(saved.keys[0]?.diode).toEqual(initial.keys[0]?.diode);
  const exported = getExportPreview(getProjectAnalysis(saved), { includeWorkflow: true });
  expect(exported.problems).toEqual([]);
  expect(exported.files.find((file) => file.path.endsWith('.overlay'))?.content).toContain(
    '<&key_physical_attrs 200 100 0 0 9000 100 50>',
  );
});

it.each(['Cancel preview', 'Escape'])(
  'discards cancelled numeric values after %s before editing another property',
  async (cancel) => {
    const { user } = renderApp(project());
    await user.click(screen.getByRole('checkbox', { name: 'Select key 0' }));
    await user.click(screen.getByText('Precise properties'));
    const rotation = screen.getByRole('spinbutton', { name: 'Selected rotation (°)' });
    await user.clear(rotation);
    await user.type(rotation, '2{Enter}');
    await cancelNumericPreview(cancel, user);
    expect(rotation.getAttribute('value')).toBe('0');
    const origin = screen.getByRole('spinbutton', { name: 'Selected origin X (u)' });
    await user.clear(origin);
    await user.type(origin, '3{Enter}');
    await user.click(screen.getByRole('button', { name: 'Apply layout' }));
    expect(loadProject().project.keys[0]?.rotationDeg).toBeUndefined();
    expect(loadProject().project.keys[0]?.rotationOriginXU).toBe(3);
  },
);

async function cancelNumericPreview(cancel: string, user: ReturnType<typeof renderApp>['user']) {
  if (cancel === 'Escape') {
    fireEvent.keyDown(screen.getByRole('application'), { key: 'Escape', code: 'Escape' });
  } else {
    await user.click(screen.getByRole('button', { name: cancel }));
  }
}
