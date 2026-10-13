// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { loadProject, serializeProject } from '@storage/project';
import { getResultValue } from '../../../helpers/result';
import type { Project } from '@domain';

function captureDownloads() {
  const blobs: Blob[] = [];
  const names: string[] = [];
  const revoke = vi.fn<(url: string) => void>();
  vi.stubGlobal(
    'URL',
    class extends URL {
      static override createObjectURL(blob: Blob) {
        blobs.push(blob);
        return `blob:download-${blobs.length}`;
      }
      static override revokeObjectURL(url: string) {
        revoke(url);
      }
    },
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download);
  });
  return { blobs, names, revoke };
}

it('downloads a real archive whose files exactly match the visible previews and releases the blob URL', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'export' });
  const download = captureDownloads();
  const paths = screen
    .getAllByText(/^(config\/|boards\/|zephyr\/|build.yaml|\.github\/)/u, { selector: 'summary' })
    .map((summary) => summary.textContent);
  const previews = Object.fromEntries(
    paths.map((path) => [path, screen.getByLabelText(path).textContent]),
  );
  await user.click(screen.getByRole('button', { name: 'Download .zip' }));
  await waitFor(() => {
    expect(download.blobs).toHaveLength(1);
  });
  const blob = getDefinedValue(download.blobs[0]);
  expect(blob.type).toBe('application/zip');
  const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  expect(Object.keys(archive).toSorted()).toEqual(paths.toSorted());
  for (const [path, bytes] of Object.entries(archive)) {
    expect(strFromU8(bytes)).toBe(previews[path]);
  }
  expect(download.names).toEqual(['unibody_six-zmk-config.zip']);
  await waitFor(() => {
    expect(download.revoke).toHaveBeenCalledWith('blob:download-1');
  });
  expect(screen.getByRole('status').textContent).toContain('Download started');
  expect(document.querySelector('a[download]')).toBeNull();
});

it('saves exact project data to a file and downloads a preview file under its basename', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'export' });
  const before = loadProject().project;
  const download = captureDownloads();
  await user.click(screen.getByRole('button', { name: 'Save' }));
  const saved = getDefinedValue(download.blobs[0]);
  expect(JSON.parse(await saved.text())).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'Download config/west.yml' }));
  expect(download.names).toEqual(['unibody_six.json', 'west.yml']);
  const file = getDefinedValue(download.blobs[1]);
  expect(await file.text()).toBe(screen.getByLabelText('config/west.yml').textContent);
});

async function uploadProject(
  input: HTMLInputElement,
  text: string,
  user: ReturnType<typeof renderApp>['user'],
) {
  const file = new File([text], 'keyboard.json', { type: 'application/json' });
  // jsdom File lacks Blob.text(); model the chosen file's OS read boundary.
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(text) });
  await user.upload(input, file);
}

it('rejects malformed imports without overwriting the project and allows choosing the same file again', async () => {
  const { user, container } = renderApp();
  const before = loadProject().project;
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  await user.click(screen.getByRole('button', { name: 'Open' }));
  await user.click(screen.getByRole('button', { name: 'Choose file…' }));
  await uploadProject(input, '{broken', user);
  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toContain('not a ZMK Customizer project');
  });
  expect(loadProject().project).toEqual(before);
  const imported: Project = {
    ...before,
    name: 'Imported keyboard',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
  await uploadProject(input, getResultValue(serializeProject(imported)), user);
  await waitFor(() => {
    expect(loadProject().project).toEqual(imported);
  });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(
    within(screen.getByRole('banner'))
      .getByRole('button', { name: /^Undo/u })
      .getAttribute('aria-disabled'),
  ).toBe('true');
});
