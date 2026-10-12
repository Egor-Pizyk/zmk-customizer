import { getDefinedValue } from '../../tests/helpers/defined-value';
import { UNIBODY_PRESET } from '../catalog/unibody-preset';
import { CONTROLLER_BOARDS } from '../catalog/controller-boards';
import { changeController } from '../domain/change-controller';
import { parseProjectFile } from '../storage/parse-project-file';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../domain/create-project';
import { renameProject } from '../domain/rename-project';
import { applyHistoryAction, createInitialState, getSaveStatus } from './project-state';
import type { ProjectState } from './project-state';

const RENAME = {
  kind: 'commit',
  update: (project: ReturnType<typeof createProject>) => renameProject(project, { name: 'B' }),
} as const;

function stubSetItem(setItem: (key: string, value: string) => void) {
  vi.stubGlobal('localStorage', { setItem });
}

function initial(status: Parameters<typeof createInitialState>[0]['status']): ProjectState {
  return createInitialState({ project: createProject(), status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyHistoryAction', () => {
  it('autosaves every change', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    stubSetItem(setItem);
    const next = applyHistoryAction(initial({ kind: 'ok' }), { action: RENAME });
    expect(setItem).toHaveBeenCalledOnce();
    expect(getSaveStatus(next)).toBe('saved');
  });

  it('reports a failed save and clears it after the next successful one', () => {
    stubSetItem(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const failed = applyHistoryAction(initial({ kind: 'ok' }), { action: RENAME });
    expect(getSaveStatus(failed)).toBe('quota-exceeded');
    stubSetItem(vi.fn<(key: string, value: string) => void>());
    expect(getSaveStatus(applyHistoryAction(failed, { action: { kind: 'undo' } }))).toBe('saved');
  });

  it('never writes while autosave is blocked by kept damaged data', () => {
    const setItem = vi.fn<(key: string, value: string) => void>();
    stubSetItem(setItem);
    const blocked = initial({ kind: 'damaged', reason: 'not-json', isBackupBlocked: true });
    const next = applyHistoryAction(blocked, { action: RENAME });
    expect(setItem).not.toHaveBeenCalled();
    expect(getSaveStatus(next)).toBe('backup-blocked');
  });

  it('gives each announcement a new id so a repeated text is announced again', () => {
    stubSetItem(vi.fn<(key: string, value: string) => void>());
    const edited = applyHistoryAction(initial({ kind: 'ok' }), { action: RENAME });
    const undone = applyHistoryAction(edited, {
      action: { kind: 'undo' },
      announcementText: 'Undone',
    });
    const redone = applyHistoryAction(undone, {
      action: { kind: 'redo' },
      announcementText: 'Undone',
    });
    expect(undone.announcement).toEqual({ text: 'Undone', id: 1 });
    expect(redone.announcement).toEqual({ text: 'Undone', id: 2 });
  });

  it('returns the same state for undo on an empty stack', () => {
    const state = initial({ kind: 'ok' });
    expect(
      applyHistoryAction(state, { action: { kind: 'undo' }, announcementText: 'Undone' }),
    ).toBe(state);
  });

  it('starts as not saved when storage was unavailable at load', () => {
    expect(getSaveStatus(initial({ kind: 'unavailable' }))).toBe('unavailable');
  });

  it('announces the issue total when an edit changes it, and nothing otherwise', () => {
    stubSetItem(vi.fn<(key: string, value: string) => void>());
    const broken = applyHistoryAction(initial({ kind: 'ok' }), {
      action: { kind: 'commit', update: (project) => renameProject(project, { name: '!!!' }) },
    });
    expect(broken.announcement).toEqual({ text: '2 problems', id: 1 });
    const renamed = applyHistoryAction(broken, {
      action: { kind: 'commit', update: (project) => renameProject(project, { name: '???' }) },
    });
    expect(renamed.announcement).toBe(broken.announcement);
    const undone = applyHistoryAction(renamed, {
      action: { kind: 'undo' },
      announcementText: 'Undone',
    });
    expect(undone.announcement?.text).toBe('Undone');
  });

  it('appends the issue total to the action text when both change', () => {
    stubSetItem(vi.fn<(key: string, value: string) => void>());
    const broken = applyHistoryAction(initial({ kind: 'ok' }), {
      action: { kind: 'commit', update: (project) => renameProject(project, { name: '!!!' }) },
    });
    const undone = applyHistoryAction(broken, {
      action: { kind: 'undo' },
      announcementText: 'Undone',
    });
    expect(undone.announcement?.text).toBe('Undone. 1 problem');
  });
});

it('autosaves controller selection, dropped endpoints and exact undo/redo states', () => {
  const writes: string[] = [];
  stubSetItem((_key, value) => {
    writes.push(value);
  });
  const before = createInitialState({ project: UNIBODY_PRESET, status: { kind: 'ok' } });
  const after = applyHistoryAction(before, {
    action: {
      kind: 'commit',
      update: (project) =>
        changeController(project, { boardId: 'seeeduino_xiao_ble', boards: CONTROLLER_BOARDS }),
    },
  });
  expect(after.history.past).toHaveLength(1);
  expect(parseProjectFile(getDefinedValue(writes.at(-1)))).toEqual({
    ok: true,
    value: after.history.present,
  });
  const undone = applyHistoryAction(after, { action: { kind: 'undo' } });
  expect(parseProjectFile(getDefinedValue(writes.at(-1)))).toEqual({
    ok: true,
    value: before.history.present,
  });
  const redone = applyHistoryAction(undone, { action: { kind: 'redo' } });
  expect(parseProjectFile(getDefinedValue(writes.at(-1)))).toEqual({
    ok: true,
    value: after.history.present,
  });
  expect(redone.history.present).toEqual(after.history.present);
});
