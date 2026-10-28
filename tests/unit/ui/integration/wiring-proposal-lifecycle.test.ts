import { PendingRoutingWorker, latestRoutingWorker } from '../../../helpers/routing-worker';
// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { loadProject } from '@storage/project';
import { buildProject } from '../../../helpers/build-project';
import { renderApp } from '../../../helpers/render-app';

function installWorker() {
  PendingRoutingWorker.instances.length = 0;
  vi.stubGlobal('Worker', PendingRoutingWorker);
}
afterEach(() => vi.unstubAllGlobals());

it('keeps calculation cancellable without changing saved data or history', async () => {
  installWorker();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  expect(screen.getByText('Calculating wiring…')).toBeDefined();
  expect(PendingRoutingWorker.instances).toHaveLength(1);
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(PendingRoutingWorker.instances[0]?.isTerminated).toBe(true);
  expect(screen.queryByText('Calculating wiring…')).toBeNull();
  expect(loadProject().project).toEqual(source);
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
});

it('terminates a pending calculation when the workspace unmounts', async () => {
  installWorker();
  const { user, unmount } = renderApp(buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] }));
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  expect(PendingRoutingWorker.instances).toHaveLength(1);
  unmount();
  expect(PendingRoutingWorker.instances[0]?.isTerminated).toBe(true);
});

it('discards a queued result after Cancel and preserves the original project', async () => {
  installWorker();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  const worker = latestRoutingWorker();
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  act(() => {
    worker.complete();
  });
  expect(screen.queryByRole('button', { name: 'Apply wiring' })).toBeNull();
  expect(loadProject().project).toEqual(source);
});

it('keeps a preview stale after an edit and Undo ABA, then recalculates explicitly', async () => {
  installWorker();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  const worker = latestRoutingWorker();
  act(() => {
    worker.complete();
  });
  expect(
    screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
  ).not.toBe('true');
  fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Changed' } });
  fireEvent.blur(screen.getByRole('textbox', { name: 'Name' }));
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  expect(screen.getByText('The project changed. Recalculate the wiring preview.')).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Recalculate wiring' }));
  act(() => {
    latestRoutingWorker().complete();
  });
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  expect(loadProject().project.wires).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});

it('ignores a superseded request and applies an accepted result only once', async () => {
  installWorker();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  const first = latestRoutingWorker();
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  expect(first.isTerminated).toBe(true);
  act(() => {
    first.complete();
  });
  expect(screen.getByText('Calculating wiring…')).toBeDefined();
  act(() => {
    latestRoutingWorker().complete();
  });
  const apply = screen.getByRole('button', { name: 'Apply wiring' });
  fireEvent.click(apply);
  fireEvent.click(apply);
  expect(loadProject().project.wires).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});

it('keeps a pending Direct choice when Rebuild supersedes its calculation', async () => {
  installWorker();
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Scanning type' }), 'direct');
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  act(() => {
    latestRoutingWorker().complete();
  });
  expect(screen.getByRole('combobox', { name: 'Scanning type' })).toHaveProperty('value', 'direct');
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  expect(loadProject().project.wiring?.kind).toBe('direct');
});

it('does not display a result calculated for a project changed while the Worker was pending', async () => {
  installWorker();
  const { user } = renderApp(buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] }));
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
    target: { value: 'Changed during calculation' },
  });
  fireEvent.blur(screen.getByRole('textbox', { name: 'Name' }));
  act(() => {
    latestRoutingWorker().complete();
  });
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  expect(document.querySelectorAll('[data-section-id]')).toHaveLength(0);
  expect(loadProject().project.wires).toHaveLength(0);
});
