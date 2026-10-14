import type { GeneratedFile } from '@generators';
import { buildExportZip } from '@storage/export';
import { downloadBlob, downloadTextFile } from '@ui/downloads';
import { useExportActions } from '@ui/export/logic';
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const state = { announce: vi.fn<(text: string) => void>() };
vi.mock('@storage/export', () => ({
  buildExportZip: vi.fn<() => Promise<Uint8Array<ArrayBuffer>>>(),
}));
vi.mock('@ui/downloads', () => ({
  downloadBlob: vi.fn<typeof downloadBlob>(() => ({ ok: true, value: undefined })),
  downloadTextFile: vi.fn<typeof downloadTextFile>(),
}));
const files: readonly GeneratedFile[] = [{ path: 'config/pad.conf', content: '# Привет\n' }];
function createActions(isBlocked = false) {
  const { result } = renderHook(() =>
    useExportActions({ files, shieldName: 'pad', isBlocked, announce: state.announce }),
  );
  return {
    handleZipDownload: async () => {
      await act(async () => {
        await result.current.handleZipDownload();
      });
    },
    handleFileCopy: async (file: GeneratedFile) => {
      await act(async () => {
        await result.current.handleFileCopy(file);
      });
    },
    handleFileDownload: (file: GeneratedFile) => {
      act(() => {
        result.current.handleFileDownload(file);
      });
    },
    result,
  };
}
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
it('blocks invalid exports and locks repeated activation before re-render', async () => {
  await createActions(true).handleZipDownload();
  expect(buildExportZip).not.toHaveBeenCalled();
  let complete: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
  vi.mocked(buildExportZip).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  vi.mocked(downloadBlob).mockReturnValueOnce({ ok: true, value: undefined });
  const handlers = createActions();
  let pending: Promise<void> | undefined;
  act(() => {
    pending = handlers.result.current.handleZipDownload();
  });
  expect(state.announce).toHaveBeenLastCalledWith('Building zip…');
  await act(async () => {
    await handlers.result.current.handleZipDownload();
  });
  expect(buildExportZip).toHaveBeenCalledOnce();
  await act(async () => {
    complete?.(new Uint8Array([1, 2, 3]));
    await pending;
  });
  expect(handlers.result.current.isBuildingZip).toBe(false);
  expect(state.announce).toHaveBeenLastCalledWith('Download started: pad-zmk-config.zip.');
});
it('captures activation files/name and produces owned ZIP Blob bytes', async () => {
  vi.mocked(buildExportZip).mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
  vi.mocked(downloadBlob).mockReturnValueOnce({ ok: true, value: undefined });
  const before = structuredClone(files);
  await createActions().handleZipDownload();
  expect(buildExportZip).toHaveBeenCalledWith(files);
  const input = vi.mocked(downloadBlob).mock.calls[0]?.[0];
  expect(input?.fileName).toBe('pad-zmk-config.zip');
  expect(input?.blob.type).toBe('application/zip');
  expect(new Uint8Array(await getDownloadedBlob().arrayBuffer())).toEqual(
    new Uint8Array([1, 2, 3]),
  );
  expect(files).toEqual(before);
});
it('reports archive failure and releases lock so retry succeeds', async () => {
  vi.mocked(buildExportZip)
    .mockRejectedValueOnce(new Error('worker blocked'))
    .mockResolvedValueOnce(new Uint8Array([1]));
  vi.mocked(downloadBlob).mockReturnValueOnce({ ok: true, value: undefined });
  const actions = createActions();
  await actions.handleZipDownload();
  expect(actions.result.current.feedback).toContain('Could not build');
  expect(actions.result.current.isBuildingZip).toBe(false);
  await actions.handleZipDownload();
  expect(downloadBlob).toHaveBeenCalledOnce();
});
it('reports browser ZIP download blockage without success announcement', async () => {
  vi.mocked(buildExportZip).mockResolvedValueOnce(new Uint8Array([1]));
  vi.mocked(downloadBlob).mockReturnValueOnce({ ok: false, error: 'blocked' });
  const actions = createActions();
  await actions.handleZipDownload();
  expect(actions.result.current.feedback).toContain('browser blocked');
  expect(state.announce.mock.lastCall?.[0]).toBe(actions.result.current.feedback);
});

it('copies exact Unicode text and announces the repository path', async () => {
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValueOnce();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const file = { path: 'config/pad.conf', content: '# Привет\n' };
  await createActions().handleFileCopy(file);
  expect(writeText).toHaveBeenCalledWith(file.content);
  expect(state.announce).toHaveBeenLastCalledWith(`Copied ${file.path}.`);
});
it('reports denied or unavailable clipboard with manual-copy guidance and permits retry', async () => {
  const file = { path: 'config/a.keymap', content: '&kp A\n' };
  vi.stubGlobal('navigator', {});
  await createActions().handleFileCopy(file);
  expect(state.announce.mock.lastCall?.[0]).toContain('Select the preview text');
  const writeText = vi
    .fn<(text: string) => Promise<void>>()
    .mockRejectedValueOnce(new Error('denied'))
    .mockResolvedValueOnce();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  await createActions().handleFileCopy(file);
  expect(state.announce.mock.lastCall?.[0]).toContain('Select the preview text');
  await createActions().handleFileCopy(file);
  expect(state.announce.mock.lastCall?.[0]).toBe('Copied config/a.keymap.');
});
it('downloads exact file text under its basename and surfaces download failure', () => {
  const file = { path: 'config/a.keymap', content: '&kp A\n' };
  vi.mocked(downloadTextFile)
    .mockReturnValueOnce({ ok: true, value: undefined })
    .mockReturnValueOnce({ ok: false, error: 'blocked' });
  createActions().handleFileDownload(file);
  expect(downloadTextFile).toHaveBeenCalledWith({
    fileName: 'a.keymap',
    text: file.content,
    mimeType: 'text/plain;charset=utf-8',
  });
  expect(state.announce.mock.lastCall?.[0]).toContain('Download started');
  createActions().handleFileDownload(file);
  expect(state.announce.mock.lastCall?.[0]).toContain('browser blocked');
});
it('blocks single-file actions while validation fails', async () => {
  const file = { path: 'config/a.keymap', content: '&kp A\n' };
  const writeText = vi.fn<(text: string) => Promise<void>>();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  await createActions(true).handleFileCopy(file);
  createActions(true).handleFileDownload(file);
  expect(writeText).not.toHaveBeenCalled();
  expect(downloadTextFile).not.toHaveBeenCalled();
});

function getDownloadedBlob(): Blob {
  const input = vi.mocked(downloadBlob).mock.calls[0]?.[0];
  if (input === undefined) {
    throw new Error('Missing download');
  }
  return input.blob;
}
