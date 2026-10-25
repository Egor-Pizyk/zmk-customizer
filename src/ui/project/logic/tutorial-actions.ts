import type { Project } from '@domain';
import { ONBOARDING_STEPS } from '@domain/onboarding';
import { loadOnboarding, discardOnboarding, saveOnboarding } from '@storage/onboarding';
import { serializeProject } from '@storage/project';
import { downloadTextFile } from '@ui/downloads';
import type { ProjectStateChange, ProjectState } from './project-state';
import { withAnnouncement } from './project-state';
import {
  beginTutorial,
  returnFromTutorial,
  adoptTutorial,
  advanceTutorial,
  setTutorialStep,
} from './tutorial-session';

export function createTutorialActions(change: ProjectStateChange) {
  return {
    startTutorial: (resume: boolean) => {
      change((state) => startSession(state, resume));
    },
    leaveTutorial: (discard: boolean) => {
      change((state) => leaveSession(state, discard));
    },
    adoptTutorial: () => {
      change(adoptTutorial);
    },
    saveOriginalProject: () => {
      change(saveOriginalFile);
    },
    nextTutorialStep: () => {
      change(advanceTutorial);
    },
    previousTutorialStep: () => {
      change(previousStep);
    },
    inspectTutorialFile: (project: Project, path: string) => {
      change((state) => inspectFile(state, { project, path }));
    },
    tutorialDownloadStarted: (project: Project) => {
      change((state) =>
        state.history.present === project && state.tutorial?.record.stepId === 'download'
          ? advanceTutorial(state)
          : state,
      );
    },
  };
}
function startSession(state: ProjectState, resume: boolean): ProjectState {
  const retained = loadOnboarding();
  if (!retained.ok) {
    return withAnnouncement(state, retained.error);
  }
  return beginTutorial(state, resume ? retained.value : undefined);
}
function leaveSession(state: ProjectState, discard: boolean): ProjectState {
  if (state.tutorial === undefined) {
    return state;
  }
  const saved = discard
    ? discardOnboarding()
    : saveOnboarding({
        ...state.tutorial.record,
        outcome: state.tutorial.record.stepId === 'finish' ? 'completed' : 'closed',
      });
  return saved.ok
    ? returnFromTutorial(state)
    : withAnnouncement(
        returnFromTutorial(state),
        `${saved.error} Returned to your original project; the last saved learning copy was retained.`,
      );
}
function previousStep(state: ProjectState): ProjectState {
  const step = state.tutorial?.record.stepId;
  const previous =
    step === undefined ? undefined : ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) - 1];
  return previous === undefined ? state : setTutorialStep(state, previous);
}
function saveOriginalFile(state: ProjectState): ProjectState {
  const project = state.tutorial?.original.history.present;
  if (project === undefined) {
    return state;
  }
  const text = serializeProject(project);
  if (!text.ok) {
    return withAnnouncement(state, 'Could not save the original project file.');
  }
  const result = downloadTextFile({ fileName: 'original-project.json', text: text.value });
  return withAnnouncement(
    state,
    result.ok ? 'Original project download started.' : 'Could not download the original project.',
  );
}
function inspectFile(
  state: ProjectState,
  input: { readonly project: Project; readonly path: string },
): ProjectState {
  if (state.tutorial?.record.stepId !== 'files' || state.history.present !== input.project) {
    return state;
  }
  const group = fileGroup(input.path);
  if (group === undefined || state.tutorial.viewedFiles?.includes(group) === true) {
    return state;
  }
  return {
    ...state,
    tutorial: { ...state.tutorial, viewedFiles: [...(state.tutorial.viewedFiles ?? []), group] },
  };
}
function fileGroup(path: string): string | undefined {
  if (path.endsWith('.keymap')) {
    return 'keymap';
  }
  if (path.endsWith('.conf')) {
    return 'firmware';
  }
  return path.includes('boards/shields/') ? 'shield' : undefined;
}
