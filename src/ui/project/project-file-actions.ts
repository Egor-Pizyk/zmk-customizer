import { SHIELD_TARGET } from '@catalog/firmware';
import { UNIBODY_PRESET } from '@catalog/presets';
import { createPresetProject, createProject, getShieldName } from '@domain';
import { readImportFile, serializeProject } from '@storage/project';
import { downloadTextFile } from '@ui/downloads';
import { applyHistoryAction, discardKeptBackup, withAnnouncement } from './project-state';
import { createImportSession } from './import-session';
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
      change((latest) =>
        applyHistoryAction(latest, {
          action: {
            kind: 'replace',
            project: createProject({ controllerId: SHIELD_TARGET.boardId }),
          },
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
