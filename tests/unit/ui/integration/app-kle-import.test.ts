// @vitest-environment jsdom
import { act, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { loadProject } from '@storage/project';

function file(text: string, read?: () => Promise<string>) {
  const imported = new File([text], 'layout.json', { type: 'application/json' });
  Object.defineProperty(imported, 'text', { value: read ?? (() => Promise.resolve(text)) });
  return imported;
}
function history(name: 'Undo' | 'Redo') {
  return within(screen.getByRole('banner')).getByRole('button', {
    name: new RegExp(`^${name}`, 'u'),
  });
}

it('reviews without saving, cancels, applies in one step, restores exact history and reloads', async () => {
  const { user, unmount, mount } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByText('Import KLE layout'));
  await user.upload(screen.getByLabelText('KLE JSON file'), file('[[{"w":1.5},"A",{"x":1},"B"]]'));
  expect(await screen.findByText('2 physical keys ready to import.')).toBeTruthy();
  expect(screen.getByRole('list', { name: 'KLE conversion warnings' }).textContent).toContain(
    'legends',
  );
  expect(loadProject().project).toEqual(before);
  await user.click(screen.getByRole('button', { name: 'Cancel KLE import' }));
  expect(screen.queryByText('2 physical keys ready to import.')).toBeNull();
  expect(document.activeElement).toBe(screen.getByLabelText('KLE JSON file'));
  expect(loadProject().project).toEqual(before);
  await user.upload(screen.getByLabelText('KLE JSON file'), file('[[{"w":1.5},"A",{"x":1},"B"]]'));
  await user.click(await screen.findByRole('button', { name: 'Replace project with KLE layout' }));
  expect(screen.queryByLabelText('KLE JSON file')).toBeNull();
  const imported = loadProject().project;
  expect(imported.keys).toEqual([
    {
      id: 'k0',
      xU: 0,
      yU: 0,
      widthU: 1.5,
      heightU: 1,
      rotationDeg: 0,
      rotationOriginXU: 0,
      rotationOriginYU: 0,
    },
    {
      id: 'k1',
      xU: 2.5,
      yU: 0,
      widthU: 1,
      heightU: 1,
      rotationDeg: 0,
      rotationOriginXU: 0,
      rotationOriginYU: 0,
    },
  ]);
  expect(imported.wires).toEqual([]);
  expect(imported.layers).toEqual([{ id: 'l0', name: 'Base', bindings: {} }]);
  await user.click(history('Undo'));
  expect(loadProject().project).toEqual(before);
  await user.click(history('Redo'));
  expect(loadProject().project).toEqual(imported);
  unmount();
  mount();
  expect(loadProject().project).toEqual(imported);
  expect(screen.getByRole('rowheader', { name: 'Key 1' })).toBeTruthy();
});

it('reports malformed/read failures and can retry the same file', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByText('Import KLE layout'));
  const input = screen.getByLabelText('KLE JSON file');
  await user.upload(input, file('bad'));
  const malformed = await screen.findByRole('alert');
  expect(malformed.textContent).toContain('JSON');
  expect(loadProject().project).toEqual(before);
  await user.upload(
    input,
    file('', () => Promise.reject(new Error('denied'))),
  );
  const unreadable = await screen.findByRole('alert');
  expect(unreadable.textContent).toContain('read');
  await user.upload(input, file('[[""]]'));
  expect(await screen.findByText('1 physical key ready to import.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('invalidates a review permanently after an edit followed by Undo', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByText('Import KLE layout'));
  await user.upload(screen.getByLabelText('KLE JSON file'), file('[["A"]]'));
  await screen.findByRole('button', { name: 'Replace project with KLE layout' });
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Changed{Enter}');
  const expired = await screen.findByRole('alert');
  expect(expired.textContent).toContain('expired');
  await user.click(history('Undo'));
  expect(loadProject().project).toEqual(before);
  expect(screen.queryByRole('button', { name: 'Replace project with KLE layout' })).toBeNull();
});

it('discards superseded and cancelled reads and refuses a read after intervening edits', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByText('Import KLE layout'));
  const input = screen.getByLabelText('KLE JSON file');
  let resolveRead: (text: string) => void = rejectUnstartedRead;
  function pending() {
    return new Promise<string>((resolve) => {
      resolveRead = resolve;
    });
  }
  await user.upload(input, file('', pending));
  await user.upload(input, file('[["New","Key"]]'));
  await screen.findByText('2 physical keys ready to import.');
  await act(async () => {
    await Promise.resolve();
    resolveRead('[["Old"]]');
  });
  expect(screen.getByText('2 physical keys ready to import.')).toBeTruthy();
  await user.upload(input, file('', pending));
  await user.click(screen.getByRole('button', { name: 'Cancel KLE import' }));
  await act(async () => {
    await Promise.resolve();
    resolveRead('[["Cancelled"]]');
  });
  expect(screen.queryByRole('button', { name: 'Replace project with KLE layout' })).toBeNull();
  await user.upload(input, file('', pending));
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Edited{Enter}');
  await user.click(history('Undo'));
  await act(async () => {
    await Promise.resolve();
    resolveRead('[["Late"]]');
  });
  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toContain('project changed');
  });
  expect(loadProject().project).toEqual(before);
  expect(screen.queryByRole('button', { name: 'Replace project with KLE layout' })).toBeNull();
});

function rejectUnstartedRead() {
  throw new Error('read not started');
}

it('clears a superseded KLE read when a project file is opened instead', async () => {
  const { user, container } = renderApp();
  await user.click(screen.getByRole('button', { name: 'New' }));
  await user.click(screen.getByText('Import KLE layout'));
  let finish: ((text: string) => void) | undefined;
  const pending = new Promise<string>((resolve) => {
    finish = resolve;
  });
  await user.upload(
    screen.getByLabelText('KLE JSON file'),
    file('', () => pending),
  );
  const input = container.querySelector<HTMLInputElement>('input[type="file"][aria-hidden="true"]');
  const project = { ...loadProject().project, name: 'Opened instead' };
  await user.upload(getDefinedValue(input), file(JSON.stringify(project)));
  await waitFor(() => {
    expect(loadProject().project.name).toBe('Opened instead');
  });
  await act(async () => {
    getDefinedValue(finish)('[["Late"]]');
    await Promise.resolve();
  });
  expect(screen.queryByText('Reading KLE file…')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Replace project with KLE layout' })).toBeNull();
  expect(loadProject().project).toEqual(project);
});
