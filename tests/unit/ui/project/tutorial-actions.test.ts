// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import {
  createInitialState,
  beginTutorial,
  createTutorialActions,
  getTutorialConditions,
  advanceTutorial,
  setTutorialStep,
} from '@ui/project/logic';
import type { ProjectState } from '@ui/project/logic';
import { createProject } from '@domain/project';
import { loadOnboarding, saveOnboarding } from '@storage/onboarding';
import { loadProject, PROJECT_STORAGE_KEY } from '@storage/project';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
function session() {
  let state: ProjectState = beginTutorial(
    createInitialState({
      project: createProject({ controllerId: 'nice_nano_v2' }),
      status: { kind: 'missing' },
    }),
  );
  const actions = createTutorialActions((change) => {
    state = change(state);
  });
  return {
    actions,
    current: () => state,
    set: (next: ProjectState) => {
      state = next;
    },
  };
}
it('Back changes only the step and Next rejects unmet earlier prerequisites', () => {
  const active = session();
  const project = active.current().history.present;
  active.set(setTutorialStep(active.current(), 'pins'));
  active.actions.previousTutorialStep();
  expect(active.current().tutorial?.record.stepId).toBe('wiring');
  active.actions.nextTutorialStep();
  expect(active.current().tutorial?.record.stepId).toBe('name');
  expect(active.current().history.present).toBe(project);
});
it('returns the original even if storage fails during accessible exit', () => {
  const active = session();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  active.actions.leaveTutorial(false);
  expect(active.current().tutorial).toBeUndefined();
  expect(active.current().history.present.name).toBe('My keyboard');
  expect(active.current().announcement?.text).toContain('last saved learning copy');
});
it('requires current session project for inspection and ignores stale ZIP receipts', () => {
  const active = session();
  const project = active.current().history.present;
  active.set(setTutorialStep(active.current(), 'files'));
  active.actions.inspectTutorialFile({ ...project }, 'config/a.keymap');
  expect(active.current().tutorial?.viewedFiles).toBeUndefined();
  for (const path of [
    'config/a.keymap',
    'config/a.conf',
    'boards/shields/a/a.overlay',
    'config/a.conf',
    'build.yaml',
  ]) {
    active.actions.inspectTutorialFile(project, path);
  }
  expect(active.current().tutorial?.viewedFiles).toEqual(['keymap', 'firmware', 'shield']);
  active.set(setTutorialStep(active.current(), 'download'));
  active.actions.tutorialDownloadStarted({ ...project });
  expect(active.current().tutorial?.record.stepId).toBe('download');
  active.actions.tutorialDownloadStarted(project);
  expect(active.current().tutorial?.record.stepId).toBe('name');
});
it('can retain, resume or explicitly discard an incomplete learning session', () => {
  const active = session();
  active.actions.leaveTutorial(false);
  expect(loadOnboarding()).toMatchObject({ ok: true, value: { outcome: 'closed' } });
  active.actions.startTutorial(true);
  expect(active.current().tutorial?.record.outcome).toBe('in-progress');
  active.actions.leaveTutorial(true);
  expect(loadOnboarding()).toEqual({ ok: true, value: undefined });
});
it('adopts only after ordinary persistence succeeds and resets replacement history', () => {
  const active = session();
  const originalBytes = localStorage.getItem(PROJECT_STORAGE_KEY);
  expect(originalBytes).not.toBeNull();
  active.actions.adoptTutorial();
  expect(active.current().tutorial).toBeUndefined();
  expect(active.current().history.past).toEqual([]);
  expect(loadProject().project).toEqual(active.current().history.present);
  expect(loadOnboarding()).toEqual({ ok: true, value: undefined });
});
it('blocks entry with a protected damaged backup and rejects corrupted retained data', () => {
  const original = createInitialState({
    project: createProject({ controllerId: 'nice_nano_v2' }),
    status: { kind: 'damaged', reason: 'not-json', isBackupBlocked: true },
  });
  expect(beginTutorial(original).tutorial).toBeUndefined();
  expect(getTutorialConditions(original).layout).toBe(false);
  expect(advanceTutorial(original)).toBe(original);
});
it('requires a fresh file review when resuming a completed session', () => {
  const active = session();
  const record = active.current().tutorial?.record;
  expect(record).toBeDefined();
  active.actions.leaveTutorial(false);
  const project = createProject({ controllerId: 'nice_nano_v2' });
  saveOnboarding({
    version: 1,
    tutorialRevision: 1,
    project,
    stepId: 'finish',
    acknowledgedStepIds: [],
    outcome: 'completed',
  });
  active.actions.startTutorial(true);
  expect(active.current().tutorial?.record.stepId).toBe('files');
  expect(active.current().tutorial?.viewedFiles).toBeUndefined();
});

it('keeps successful adoption when removing the redundant tutorial copy fails', () => {
  const active = session();
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  active.actions.adoptTutorial();
  expect(active.current().tutorial).toBeUndefined();
  expect(loadProject().project).toEqual(active.current().history.present);
  expect(active.current().announcement?.text).toContain('could not be removed');
});
