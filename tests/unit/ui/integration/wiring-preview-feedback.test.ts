// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { loadProject } from '@storage/project';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { latestRoutingWorker, PendingRoutingWorker } from '../../../helpers/routing-worker';

function controlWorkers() {
  PendingRoutingWorker.instances.length = 0;
  vi.stubGlobal('Worker', PendingRoutingWorker);
}

it('shows a browser worker failure without saving, and Cancel restores opener focus', async () => {
  controlWorkers();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  const rebuild = screen.getByRole('button', { name: 'Rebuild wiring' });
  await user.click(rebuild);
  act(() => {
    latestRoutingWorker().fail('Worker interrupted');
  });
  expect(screen.getByRole('alert').textContent).toBe('Worker interrupted');
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(document.activeElement).toBe(rebuild);
});

it('shows no work for unchanged settings and adds neither autosave nor history', async () => {
  controlWorkers();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Rebuild wiring' }));
  act(() => {
    latestRoutingWorker().complete();
  });
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  const before = loadProject().project;
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Diode direction' }), 'col2row');
  act(() => {
    latestRoutingWorker().complete();
  });
  expect(screen.getByText('No wiring changes needed.')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(setItem.mock.calls.filter(([key]) => key === 'zmk-customizer:project')).toHaveLength(0);
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});

it('terminates a Worker whose request cannot be cloned and preserves the project', async () => {
  controlWorkers();
  vi.spyOn(PendingRoutingWorker.prototype, 'postMessage').mockImplementation(() => {
    throw new DOMException('Cannot clone request', 'DataCloneError');
  });
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Rebuild wiring' }));
  expect(screen.getByRole('alert').textContent).toBe(
    'Cannot start routing worker: Cannot clone request',
  );
  expect(latestRoutingWorker().isTerminated).toBe(true);
  expect(loadProject().project).toEqual(source);
});
