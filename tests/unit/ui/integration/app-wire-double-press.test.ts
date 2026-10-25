// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { buildProject, freeEnd } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('inserts one persisted bend for rapid presses before React renders, with exact history', async () => {
  const before = buildProject({
    wires: [{ id: 'w1', start: freeEnd(1, 1), end: freeEnd(5, 1), bends: [] }],
  });
  const { user } = renderApp(before);
  const path = getDefinedValue(
    document.querySelector('[data-section-id] path[pointer-events="stroke"]'),
  );
  const canvas = screen.getByRole('application');
  act(() => {
    fireEvent.pointerDown(path, { button: 0, clientX: 144, clientY: 48 });
    fireEvent.pointerUp(canvas, { button: 0, clientX: 144, clientY: 48 });
    fireEvent.pointerDown(path, { button: 0, clientX: 144, clientY: 48 });
    fireEvent.pointerUp(canvas, { button: 0, clientX: 144, clientY: 48 });
  });
  expect(loadProject().project.wires[0]?.bends).toEqual([{ xU: 3, yU: 1 }]);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project.wires[0]?.bends).toEqual([{ xU: 3, yU: 1 }]);
});
