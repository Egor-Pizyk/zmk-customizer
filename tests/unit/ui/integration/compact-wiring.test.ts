// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getRoutingSettings } from '@domain/wiring';
import { loadProject } from '@storage/project';
import { renderApp } from '../../../helpers/render-app';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';

it('offers only generation without numeric routing tuning or a separate routing group', async () => {
  const { user } = renderApp();
  await user.click(screen.getByText('Wiring', { exact: true }));
  expect(screen.queryByRole('button', { name: 'Rebuild wiring' })).toBeNull();
  expect(screen.queryByRole('group', { name: 'Routing' })).toBeNull();
  expect(screen.queryByLabelText('Routing offset (u)')).toBeNull();
  expect(screen.queryByLabelText('Parallel clearance (u)')).toBeNull();
  expect(screen.queryByLabelText('Single-row interval (u)')).toBeNull();
  expect(screen.queryByRole('combobox', { name: 'Routing style' })).toBeNull();
  const generate = screen.getByRole('button', { name: 'Generate wiring' });
  expect(screen.queryByRole('button', { name: 'Prettify' })).toBeNull();
  expect(generate.className).toContain('bg-accent');
  expect(screen.getByRole('combobox', { name: 'left row 0 pin' })).toBeDefined();
  const manual = screen.getByText('Manual assignments', { exact: true });
  expect(manual.closest('details')?.open).toBe(false);
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
  await user.click(manual);
  expect(manual.closest('details')?.open).toBe(true);
  expect(screen.getByLabelText('Key 0 matrix row')).toBeDefined();

  await user.click(generate);
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(UNIBODY_PRESET);
});

it('preserves saved routing distances without exposing tuning controls', async () => {
  const source = {
    ...UNIBODY_PRESET,
    routing: {
      ...getRoutingSettings(UNIBODY_PRESET),
      offsetU: 0.225,
      clearanceU: 0.125,
      fallbackRowIntervalU: 1.5,
    },
  };
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));

  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  expect(loadProject().project.routing).toEqual({
    ...source.routing,
    matrixStyle: 'symmetric-bus',
  });
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});
