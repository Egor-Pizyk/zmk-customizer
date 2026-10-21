// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { screen, within, waitFor, cleanup } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';
import { buildExportZip } from '@storage/export';
import type * as ExportModule from '@storage/export';

// Only the asynchronous ZIP/browser boundaries are mocked; package/domain/app remain real.
vi.mock('@storage/export', async (importOriginal) => ({
  ...(await importOriginal<typeof ExportModule>()),
  buildExportZip: vi.fn<typeof buildExportZip>(),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function setupDownload() {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    /* Browser download boundary. */
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn<() => string>(() => 'blob:agent'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn<() => void>() });
  return click;
}

it('downloads without changing current project or history and reports retry on blocked download', async () => {
  vi.mocked(buildExportZip).mockResolvedValue(new Uint8Array([1, 2, 3]));
  const click = setupDownload();
  const { user } = renderApp();
  const original = loadProject().project;
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Package owner{Enter}');
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Create with agent' }));
  const dialog = screen.getByRole('dialog', { name: 'Create with agent' });
  expect(within(dialog).getByText(/Save your current project/u)).toBeTruthy();
  click.mockImplementationOnce(() => {
    throw new Error('blocked');
  });
  await user.click(within(dialog).getByRole('button', { name: 'Download agent package' }));
  expect(within(dialog).getByText(/Could not download/u)).toBeTruthy();
  await user.click(within(dialog).getByRole('button', { name: 'Download agent package' }));
  const status = await screen.findByRole('status');
  expect(status.textContent).toContain('Agent package download started');
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('button', { name: /^Undo/u }).hasAttribute('aria-disabled')).toBe(false);
  expect(click).toHaveBeenCalledTimes(2);
  await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(original);
  await user.click(screen.getByRole('button', { name: /^Redo/u }));
  expect(loadProject().project).toEqual(before);
});

it('locks pending downloads and cancels stale delivery when the dialog is closed and reopened', async () => {
  let finish: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
  vi.mocked(buildExportZip).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const click = setupDownload();
  const { user } = renderApp();
  await user.click(screen.getByRole('button', { name: 'Create with agent' }));
  const dialog = screen.getByRole('dialog', { name: 'Create with agent' });
  await user.click(within(dialog).getByRole('button', { name: 'Download agent package' }));
  const busy = within(dialog).getByRole('button', { name: 'Building package…' });
  expect(busy.getAttribute('aria-busy')).toBe('true');
  await user.click(busy);
  expect(buildExportZip).toHaveBeenCalledTimes(1);
  await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  await user.click(screen.getByRole('button', { name: 'Create with agent' }));
  finish?.(new Uint8Array([1]));
  await waitFor(() => {
    expect(
      within(screen.getByRole('dialog', { name: 'Create with agent' }))
        .getByRole('button', { name: 'Download agent package' })
        .hasAttribute('aria-disabled'),
    ).toBe(false);
  });
  expect(click).not.toHaveBeenCalled();
});

it('reports packaging failure and allows a successful retry', async () => {
  vi.mocked(buildExportZip)
    .mockRejectedValueOnce(new Error('zip'))
    .mockResolvedValueOnce(new Uint8Array([1]));
  const click = setupDownload();
  const { user } = renderApp();
  await user.click(screen.getByRole('button', { name: 'Create with agent' }));
  const dialog = screen.getByRole('dialog', { name: 'Create with agent' });
  await user.click(within(dialog).getByRole('button', { name: 'Download agent package' }));
  expect(within(dialog).getByText(/Could not build/u)).toBeTruthy();
  await user.click(within(dialog).getByRole('button', { name: 'Download agent package' }));
  expect(click).toHaveBeenCalledTimes(1);
});
