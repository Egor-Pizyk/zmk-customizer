import { UNIBODY_PRESET } from '@catalog/presets';
import { loadProject } from '@storage/project';
// @vitest-environment jsdom
import { getDefinedValue } from '../../../helpers/defined-value';
import { buildWiringProject } from '../../../helpers/wiring-project';
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';

it('previews a row pin edit without saving, then applies once and undoes the actual circuit', async () => {
  const { user } = renderApp(UNIBODY_PRESET);
  const before = loadProject().project;
  await user.click(screen.getByText('Wiring'));
  await user.selectOptions(screen.getByRole('combobox', { name: 'left row 0 pin' }), '21');
  expect(loadProject().project).toEqual(before);
  expect(screen.getByText('Wiring preview')).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(before);
  await user.selectOptions(screen.getByRole('combobox', { name: 'left row 0 pin' }), '21');
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  expect(loadProject().project.wiring?.terminals[0]?.boardPin).toBe(21);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('discards a stale preview after project changes and does not resurrect it on Undo', async () => {
  const { user } = renderApp(UNIBODY_PRESET);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'left row 0 pin' }), '21');
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Controller board' }),
    'seeeduino_xiao_ble',
  );
  expect(screen.queryByText('Wiring preview')).toBeNull();
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(screen.queryByText('Wiring preview')).toBeNull();
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
});
it('opens the wiring pin target from an export problem and permits repair', async () => {
  const { user } = renderApp(buildWiringProject());
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'left row 0 pin' }), '');
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  await user.click(screen.getByRole('button', { name: /^Export/u }));
  await user.click(screen.getByRole('button', { name: /Schematic: left row t0 has no pin/u }));
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'left row 0 pin' }));
  });
  await user.selectOptions(screen.getByRole('combobox', { name: 'left row 0 pin' }), '0');
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  expect(loadProject().project.wiring?.terminals[0]?.boardPin).toBe(0);
});

it('shows an imported unavailable GPIO as unavailable instead of silently showing a different pin', async () => {
  const project = buildWiringProject();
  const wiring = getDefinedValue(project.wiring);
  const { user } = renderApp({
    ...project,
    wiring: { ...wiring, terminals: wiring.terminals.map(unavailableFirstRow) },
  });
  await user.click(screen.getByText('Wiring', { exact: true }));
  expect(screen.getByRole('combobox', { name: 'left row 0 pin' })).toHaveProperty('value', '31');
  expect(
    within(screen.getByRole('combobox', { name: 'left row 0 pin' })).getByRole('option', {
      name: 'D31 (unavailable)',
    }),
  ).toBeDefined();
});
function unavailableFirstRow(
  terminal: NonNullable<ReturnType<typeof buildWiringProject>['wiring']>['terminals'][number],
) {
  return terminal.id === 't0' ? { ...terminal, boardPin: 31 } : terminal;
}
