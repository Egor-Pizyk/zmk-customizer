import { keycodeByName } from '@catalog/bindings';
import { assertNever } from '@domain';
import { ONBOARDING_STEPS, getOnboardingConditions } from '@domain/onboarding';
import type { OnboardingStepId, OnboardingRecord } from '@domain/onboarding';
import { createProject } from '@domain/project';
import { CONTROLLER_BOARDS } from '@catalog/controllers';
import { saveProject } from '@storage/project';
import { saveOnboarding, discardOnboarding } from '@storage/onboarding';
import { getProjectAnalysis, withAnnouncement } from './project-state';
import type { ProjectState } from './project-state';

export function getTutorialConditions(state: ProjectState) {
  const project = state.history.present;
  const { matrix, issues } = getProjectAnalysis(project);
  const board = CONTROLLER_BOARDS.find((entry) => entry.id === project.controllerId);
  const hasMatrix =
    matrix.ok &&
    matrix.value.rowPins.length === 3 &&
    matrix.value.colPins.length === 3 &&
    matrix.value.cells.length === 9 &&
    project.wiring?.topology !== 'split';
  return getOnboardingConditions(project, {
    hasValidName: !issues.some(
      (issue) => issue.path[0] === 'name' || issue.path[0] === 'shieldName',
    ),
    digitKeycodes: Array.from({ length: 9 }, (_, index) => {
      const keycode = keycodeByName.get(`N${index + 1}`);
      return keycode === undefined ? [] : [keycode.name, ...keycode.aliases];
    }),
    hasMatrix,
    hasPins:
      hasMatrix &&
      board !== undefined &&
      [...matrix.value.rowPins, ...matrix.value.colPins].every((pin) =>
        board.gpioPins.some((available) => available === pin),
      ),
    hasIssues: issues.length > 0,
    isBoardSupported: board !== undefined,
  });
}

export function beginTutorial(state: ProjectState, retained?: OnboardingRecord): ProjectState {
  if (state.tutorial !== undefined) {
    return state;
  }
  if (state.isAutosaveBlocked || !saveProject(state.history.present).ok) {
    return withAnnouncement(
      state,
      'Could not protect your project. Save your work and restore browser storage before starting the tour.',
    );
  }
  const record = createTutorialRecord(retained);
  const project = record.project;
  if (!saveOnboarding(record).ok) {
    return withAnnouncement(
      state,
      'Could not save the learning session. Your original project is unchanged.',
    );
  }
  return withAnnouncement(
    {
      ...state,
      history: { past: [], present: project, future: [] },
      tutorial: { original: state, record },
      sessionId: (state.sessionId ?? 0) + 1,
    },
    'Learning session started. Your original project is protected.',
  );
}

export function returnFromTutorial(state: ProjectState): ProjectState {
  if (state.tutorial === undefined) {
    return state;
  }
  return withAnnouncement(
    { ...state.tutorial.original, sessionId: (state.sessionId ?? 0) + 1 },
    'Returned to your original project.',
  );
}

export function adoptTutorial(state: ProjectState): ProjectState {
  if (state.tutorial === undefined) {
    return state;
  }
  if (!saveProject(state.history.present).ok) {
    return withAnnouncement(
      state,
      'Could not save the learning project as your current project. Both projects are still available.',
    );
  }
  const saved: ProjectState = {
    ...state.tutorial.original,
    history: { past: [], present: state.history.present, future: [] },
    sessionId: (state.sessionId ?? 0) + 1,
  };
  const removed = discardOnboarding();
  return withAnnouncement(
    saved,
    removed.ok
      ? 'Learning project is now your current project.'
      : 'Project saved. The retained learning copy could not be removed.',
  );
}

export function setTutorialStep(state: ProjectState, stepId: OnboardingStepId): ProjectState {
  if (state.tutorial === undefined) {
    return state;
  }
  const record = { ...state.tutorial.record, stepId };
  if (!saveOnboarding(record).ok) {
    return withAnnouncement(
      state,
      'Could not save your learning progress. Retry or exit; your project is safe.',
    );
  }
  return withAnnouncement(
    { ...state, tutorial: { ...state.tutorial, record } },
    `Tour step ${ONBOARDING_STEPS.indexOf(stepId) + 1} of ${ONBOARDING_STEPS.length}: ${stepId.replaceAll('-', ' ')}.`,
  );
}

export function advanceTutorial(state: ProjectState): ProjectState {
  const record = state.tutorial?.record;
  if (record === undefined) {
    return state;
  }
  const conditions = getTutorialConditions(state);
  const unmet = ONBOARDING_STEPS.slice(0, ONBOARDING_STEPS.indexOf(record.stepId) + 1).find(
    (step) => step in conditions && !isConditionMet(conditions, step),
  );
  if (unmet !== undefined) {
    return setTutorialStep(state, unmet);
  }
  const next = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(record.stepId) + 1];
  return next === undefined ? state : setTutorialStep(state, next);
}

function isConditionMet(
  conditions: ReturnType<typeof getTutorialConditions>,
  step: OnboardingStepId,
): boolean {
  switch (step) {
    case 'name':
    case 'layout':
    case 'controller':
    case 'diodes':
    case 'wiring':
    case 'pins':
    case 'bindings':
    case 'problems': {
      return conditions[step];
    }
    case 'discovery-import':
    case 'discovery-settings':
    case 'discovery-bindings':
    case 'discovery-hardware':
    case 'discovery-project':
    case 'download':
    case 'files':
    case 'finish':
    case 'firmware': {
      return true;
    }
    default: {
      return assertNever(step);
    }
  }
}

export function synchronizeTutorial(before: ProjectState, after: ProjectState): ProjectState {
  if (before.history.present === after.history.present || after.tutorial === undefined) {
    return after;
  }
  const step = after.tutorial.record.stepId;
  const conditions = getTutorialConditions(after);
  const unmet = ONBOARDING_STEPS.slice(0, ONBOARDING_STEPS.indexOf(step)).find(
    (id) => !isConditionMet(conditions, id),
  );
  if (unmet !== undefined) {
    return setTutorialStep(after, unmet);
  }
  return ['name', 'layout', 'controller', 'diodes', 'wiring', 'pins', 'bindings'].includes(step) &&
    isConditionMet(conditions, step)
    ? advanceTutorial(after)
    : after;
}

function createTutorialRecord(retained: OnboardingRecord | undefined): OnboardingRecord {
  const project = retained?.project ?? createProject({ controllerId: 'nice_nano_v2' });
  const record: OnboardingRecord =
    retained === undefined
      ? {
          version: 1,
          tutorialRevision: 1,
          project,
          stepId: 'name',
          acknowledgedStepIds: [],
          outcome: 'in-progress',
        }
      : {
          ...retained,
          outcome: 'in-progress',
          stepId:
            ONBOARDING_STEPS.indexOf(retained.stepId) >= ONBOARDING_STEPS.indexOf('files')
              ? 'files'
              : retained.stepId,
        };
  return record;
}
