import { SHIELD_TARGET } from '@catalog/firmware';
import type { PresetLayout, PresetBindingMode } from '@domain/project';
import { createLayoutPresetProject, createProject, getShieldName } from '@domain/project';
import { readImportFile, serializeProject } from '@storage/project';
import { downloadTextFile } from '@ui/downloads';
import { applyHistoryAction, discardKeptBackup, withAnnouncement } from './project-state';
import type { ProjectState, ProjectStateChange } from './project-state';
import { createImportSession } from './import-session';

function saveToFile(state: ProjectState): ProjectState {
  const project = state.history.present;
  const fileName = `${getShieldName(project) || 'keyboard'}.json`;
  const serialized = serializeProject(project);
  if (!serialized.ok) {
    return withAnnouncement(state, `Could not save the file: ${serialized.error}.`);
  }
  const downloaded = downloadTextFile({ fileName, text: serialized.value });
  return downloaded.ok ? state : withAnnouncement(state, 'Could not save the file.');
}

function downloadBackup(state: ProjectState): ProjectState {
  if (state.backup === undefined) {
    return state;
  }
  const downloaded = downloadTextFile({
    fileName: 'damaged-project.json',
    text: state.backup.text,
  });
  return downloaded.ok ? state : withAnnouncement(state, 'Could not save the file.');
}

async function openProjectFile(
  file: File,
  change: ProjectStateChange,
  session: ReturnType<typeof createImportSession>,
) {
  const token = session.begin();
  const read = await readImportFile(file);
  change((latest) => {
    if (session.status(token) === 'superseded') {
      return latest;
    }
    if (session.status(token) === 'changed') {
      return withAnnouncement(
        latest,
        'Open cancelled because the project changed. Choose the file again to open it.',
      );
    }
    if (!read.ok) {
      return { ...latest, rejectedFile: read.error };
    }
    const action = { kind: 'replace', project: read.value } as const;
    const opened = applyHistoryAction(latest, {
      action,
      announcementText: `Opened ${file.name}`,
    });
    return { ...opened, rejectedFile: undefined };
  });
}

// Project file flows: Save, Open, New and the kept damaged data (spec 002 US3–US5, US7).
export function createFileActions(
  change: ProjectStateChange,
  session: ReturnType<typeof createImportSession> = createImportSession(),
) {
  return {
    saveProjectFile: () => {
      change(saveToFile);
    },
    openProjectFile: (file: File) => openProjectFile(file, change, session),
    dismissRejectedFile: () => {
      change((latest) => ({ ...latest, rejectedFile: undefined }));
    },
    startNewProject: () => {
      startNewProject(change);
    },
    startLayoutPresetProject: (input: {
      readonly preset: PresetLayout;
      readonly bindingMode: PresetBindingMode;
    }) => {
      startLayoutPresetProject(change, input);
    },
    downloadKeptBackup: () => {
      change(downloadBackup);
    },
    discardKeptBackup: () => {
      change(discardKeptBackup);
    },
  };
}

function startLayoutPresetProject(
  change: ProjectStateChange,
  input: { readonly preset: PresetLayout; readonly bindingMode: PresetBindingMode },
) {
  change((latest) =>
    applyHistoryAction(latest, {
      action: {
        kind: 'replace',
        project: createLayoutPresetProject({
          ...input,
          controllerId: latest.history.present.controllerId,
        }),
      },
      announcementText: `Started ${input.preset.name} with ${input.bindingMode === 'empty' ? 'an empty keymap' : 'QWERTY bindings'}`,
    }),
  );
}

function startNewProject(change: ProjectStateChange) {
  change((latest) =>
    applyHistoryAction(latest, {
      action: {
        kind: 'replace',
        project: createProject({ controllerId: SHIELD_TARGET.boardId }),
      },
      announcementText: 'Started a new project',
    }),
  );
}
