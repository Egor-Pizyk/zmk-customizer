import { UNIBODY_PRESET } from '../catalog/unibody-preset';
import { createPresetProject } from '../domain/create-preset-project';
import { createProject } from '../domain/create-project';
import { getShieldName } from '../domain/get-shield-name';
import { readImportFile } from '../storage/read-import-file';
import { serializeProject } from '../storage/serialize-project';
import { downloadTextFile } from './download-text-file';
import { applyHistoryAction, discardKeptBackup, withAnnouncement } from './project-state';
import type { ProjectState, ProjectStateChange } from './project-state';

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

async function openProjectFile(file: File, change: ProjectStateChange) {
  const read = await readImportFile(file);
  change((latest) => {
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
export function createFileActions(change: ProjectStateChange) {
  return {
    saveProjectFile: () => {
      change(saveToFile);
    },
    openProjectFile: (file: File) => openProjectFile(file, change),
    dismissRejectedFile: () => {
      change((latest) => ({ ...latest, rejectedFile: undefined }));
    },
    startNewProject: () => {
      change((latest) =>
        applyHistoryAction(latest, {
          action: { kind: 'replace', project: createProject() },
          announcementText: 'Started a new project',
        }),
      );
    },
    startPresetProject: () => {
      change((latest) =>
        applyHistoryAction(latest, {
          action: { kind: 'replace', project: createPresetProject(UNIBODY_PRESET) },
          announcementText: 'Started the six-key unibody preset',
        }),
      );
    },
    downloadKeptBackup: () => {
      change(downloadBackup);
    },
    discardKeptBackup: () => {
      change(discardKeptBackup);
    },
  };
}
