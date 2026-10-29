// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { getWiringCells } from '@domain/wiring/matrix';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';

it('stages routing options locally, previews actual buses and applies them in one history step', async () => {
  const source = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 1, yU: 0 },
    ],
  });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));

  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  expect(loadProject().project).toEqual(source);
  expect(screen.getByText('Generate Symmetric matrix buses · Whole schematic')).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  const candidate = loadProject().project;
  expect(candidate.routing?.matrixStyle).toBe('symmetric-bus');
  expect(getWiringCells(candidate).map(({ row, col }) => [row, col])).toEqual([
    [0, 0],
    [0, 1],
  ]);
  expect(candidate.wires.filter((wire) => wire.end.kind === 'junction')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(candidate);
});
