import { act, renderHook } from '@testing-library/react';
// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { createProject } from '@domain/project';
import {
  createInitialState,
  useProjectState,
  setTutorialStep,
  applyHistoryAction,
  beginTutorial,
  returnFromTutorial,
  adoptTutorial,
} from '@ui/project/logic';
import { loadProject, PROJECT_STORAGE_KEY, saveProject } from '@storage/project';
import { ONBOARDING_SESSION_KEY } from '@storage/onboarding';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
function originalState() {
  saveProject({ ...createProject({ controllerId: 'nice_nano_v2' }), name: 'Original' });
  return applyHistoryAction(createInitialState(loadProject()), {
    action: { kind: 'commit', update: (project) => ({ ...project, name: 'Edited original' }) },
  });
}
it('parks the exact original state/history and routes edits/undo to tutorial storage only', () => {
  const original = originalState();
  const bytes = localStorage.getItem(PROJECT_STORAGE_KEY);
  const active = beginTutorial(original);
  expect(active.tutorial?.record.project.keys).toEqual([]);
  const edited = applyHistoryAction(active, {
    action: { kind: 'commit', update: (project) => ({ ...project, name: 'Learning' }) },
  });
  expect(edited.history.present.name).toBe('Learning');
  expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(bytes);
  expect(localStorage.getItem(ONBOARDING_SESSION_KEY)).toContain('Learning');
  const undone = applyHistoryAction(edited, { action: { kind: 'undo' } });
  expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(bytes);
  expect(returnFromTutorial(undone).history).toBe(original.history);
  expect(loadProject().project.name).toBe('Edited original');
});
it('refuses tutorial edits when their save fails and keeps both histories intact', () => {
  const active = beginTutorial(originalState());
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  const edited = applyHistoryAction(active, {
    action: { kind: 'commit', update: (project) => ({ ...project, name: 'Unsaved' }) },
  });
  expect(edited.history).toBe(active.history);
  expect(edited.announcement?.text).toMatch(/Could not save/u);
  expect(returnFromTutorial(edited).history.present.name).toBe('Edited original');
});
it('does not enter when original cannot save and does not adopt after failed ordinary write', () => {
  const original = originalState();
  const active = beginTutorial(original);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(beginTutorial(original).tutorial).toBeUndefined();
  expect(adoptTutorial(active).tutorial).toBeDefined();
});

it('invalidates pending imports on session switch even after returning to the original reference', () => {
  const original = originalState();
  const hook = renderHook(() =>
    useProjectState({ project: original.history.present, status: { kind: 'ok' } }),
  );
  const token = hook.result.current.importSession.begin();
  act(() => {
    hook.result.current.change(beginTutorial);
  });
  expect(hook.result.current.importSession.status(token)).toBe('changed');
  act(() => {
    hook.result.current.change(returnFromTutorial);
  });
  expect(hook.result.current.state.history.present).toBe(original.history.present);
  expect(hook.result.current.importSession.status(token)).toBe('changed');
});

it('advances a controller action automatically, while an unchanged default needs acknowledgement', () => {
  const hook = renderHook(() =>
    useProjectState({
      project: createProject({ controllerId: 'nice_nano_v2' }),
      status: { kind: 'missing' },
    }),
  );
  act(() => {
    hook.result.current.change(beginTutorial);
  });
  act(() => {
    hook.result.current.change((state) =>
      applyHistoryAction(state, {
        action: {
          kind: 'commit',
          update: (project) => ({
            ...project,
            name: 'Pad',
            keys: Array.from({ length: 9 }, (_, index) => ({
              id: `k${index}`,
              xU: index % 3,
              yU: Math.floor(index / 3),
            })),
          }),
        },
      }),
    );
  });
  act(() => {
    hook.result.current.change((state) => setTutorialStep(state, 'controller'));
  });
  expect(hook.result.current.state.tutorial?.record.stepId).toBe('controller');
  act(() => {
    hook.result.current.change((state) =>
      applyHistoryAction(state, {
        action: {
          kind: 'commit',
          update: (project) => ({ ...project, controllerId: 'adafruit_kb2040' }),
        },
      }),
    );
  });
  expect(hook.result.current.state.tutorial?.record.stepId).toBe('diodes');
});
