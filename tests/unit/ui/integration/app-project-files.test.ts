// @vitest-environment jsdom
import { act, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { getDefinedValue } from '../../../helpers/defined-value';
import { createProject } from '@domain';
import { loadProject } from '@storage/project';

function pendingFile(name: string) {
  let finish: ((text: string) => void) | undefined;
  const file = new File([], `${name}.json`, { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  });
  return {
    file,
    finish: (
      text = JSON.stringify({ ...createProject({ controllerId: 'nice_nano_v2' }), name }),
    ) => {
      getDefinedValue(finish)(text);
    },
  };
}

it.each([
  [0, 1],
  [1, 0],
] as const)(
  'keeps the latest Open request when older completes first: %s',
  async (firstIndex, secondIndex) => {
    const { user, container } = renderApp();
    const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
    const older = pendingFile('Older');
    const newer = pendingFile('Newer');
    await user.upload(input, older.file);
    await user.upload(input, newer.file);
    await act(async () => {
      const files = [older, newer];
      const first = getDefinedValue(files[firstIndex]);
      const second = getDefinedValue(files[secondIndex]);
      first.finish();
      await Promise.resolve();
      second.finish();
    });
    await waitFor(() => {
      expect(loadProject().project.name).toBe('Newer');
    });
    expect(screen.queryByRole('alert')).toBeNull();
  },
);

it('ignores an old failure after a successful Open and allows retry', async () => {
  const { user, container } = renderApp();
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  const older = pendingFile('Older');
  const newer = pendingFile('Newer');
  await user.upload(input, older.file);
  await user.upload(input, newer.file);
  await act(async () => {
    newer.finish();
    await Promise.resolve();
  });
  await act(async () => {
    older.finish('{broken');
    await Promise.resolve();
  });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(loadProject().project.name).toBe('Newer');
  const retry = pendingFile('Retry');
  await user.upload(input, retry.file);
  await act(async () => {
    retry.finish();
    await Promise.resolve();
  });
  expect(loadProject().project.name).toBe('Retry');
});

it('does not replace New with a pending Open', async () => {
  const { user, container } = renderApp();
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  const pending = pendingFile('Older');
  await user.upload(input, pending.file);
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByRole('button', { name: 'Start new project' }));
  await act(async () => {
    pending.finish();
    await Promise.resolve();
  });
  expect(loadProject().project).toEqual(createProject({ controllerId: 'nice_nano_v2' }));
});

it('keeps edits made during Open and announces the cancellation', async () => {
  const { user, container } = renderApp();
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  const pending = pendingFile('Older');
  await user.upload(input, pending.file);
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited{Enter}');
  await act(async () => {
    pending.finish();
    await Promise.resolve();
  });
  expect(loadProject().project.name).toBe('Edited');
  expect(screen.getByRole('status').textContent).toContain('Open cancelled');
});

it('rejects excessive import complexity while keeping the saved current project', async () => {
  const { user, container } = renderApp();
  const before = loadProject().project;
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  const pending = pendingFile('Excessive');
  await user.upload(input, pending.file);
  await act(async () => {
    pending.finish(
      JSON.stringify({
        ...createProject({ controllerId: 'nice_nano_v2' }),
        keys: Array.from({ length: 513 }, (_, index) => ({ id: `k${index}`, xU: index, yU: 0 })),
      }),
    );
    await Promise.resolve();
  });
  expect(screen.getByRole('alert').textContent).toContain('keys');
  expect(loadProject().project).toEqual(before);
});

it('invalidates a pending Open even when edit followed by Undo returns to the same project object', async () => {
  const { user, container } = renderApp();
  const before = loadProject().project;
  const input = getDefinedValue(container.querySelector<HTMLInputElement>('input[type="file"]'));
  const pending = pendingFile('Older');
  await user.upload(input, pending.file);
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited{Enter}');
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await act(async () => {
    pending.finish();
    await Promise.resolve();
  });
  expect(loadProject().project).toEqual(before);
  expect(screen.getByRole('status').textContent).toContain('Open cancelled');
});
