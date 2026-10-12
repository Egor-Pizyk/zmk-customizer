import { afterEach, expect, it, vi } from 'vitest';
import { createProject } from '../domain/create-project';
import { createFileActions } from './project-file-actions';
import { applyHistoryAction, createInitialState } from './project-state';

afterEach(() => {
  vi.unstubAllGlobals();
});
it('New preset autosaves through replacement, resets history, and later edits undo/redo while empty New stays available', () => {
  const setItem = vi.fn<(key: string, value: string) => void>();
  vi.stubGlobal('localStorage', { setItem });
  const empty = createProject({ controllerId: 'nice_nano_v2' });
  let state = createInitialState({ project: empty, status: { kind: 'ok' } });
  const actions = createFileActions((change) => {
    state = change(state);
  });
  actions.startPresetProject();
  expect(state.history.present.keys).toHaveLength(6);
  expect(setItem).toHaveBeenCalledOnce();
  const preset = state.history.present;
  expect(state.history.past).toEqual([]);
  state = applyHistoryAction(state, {
    action: { kind: 'commit', update: (project) => ({ ...project, name: 'Changed' }) },
  });
  state = applyHistoryAction(state, { action: { kind: 'undo' } });
  expect(state.history.present).toBe(preset);
  state = applyHistoryAction(state, { action: { kind: 'redo' } });
  expect(state.history.present.name).toBe('Changed');
  actions.startNewProject();
  expect(state.history.present.keys).toHaveLength(0);
});
