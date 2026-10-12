import type { ReactNode } from 'react';
import { Button } from '../components/button';
import { useProject } from '../project-context';
import type { KeptBackup, SaveStatus } from '../project-state';
import { formatProjectFileError } from './format-project-file-error';

const STORAGE_WARNING: Partial<Record<SaveStatus, string>> = {
  unavailable:
    'Autosave is off: this browser does not let the app store your project. Save it to a file to keep your work.',
  'quota-exceeded':
    'Autosave is off: browser storage is full. Save the project to a file to keep your work.',
  'backup-blocked':
    'Autosave is off: another saved project could not be read and is kept in this browser until you download or discard the damaged data below.',
};

const DAMAGE_REASON_TEXT = {
  'not-json': 'it is not valid JSON',
  'not-project': 'it is not a project',
  'newer-version': 'it was made by a newer version of ZMK Customizer',
} as const;

type ProjectMessagesProps = {
  readonly onDiscardClick: () => void;
};

// Banners below the project bar, each announced once as an alert (research R15).
export function ProjectMessages({ onDiscardClick }: ProjectMessagesProps) {
  const { saveStatus, saveError, backup } = useProject();
  const storageWarning =
    saveError?.kind === 'invalid-project'
      ? `Autosave is off: the project data could not be saved (${saveError.reason}). Undo the last change or open a valid project file. Your current work remains in memory.`
      : STORAGE_WARNING[saveStatus];

  function handleDiscardClick() {
    onDiscardClick();
  }

  return (
    <div className="flex shrink-0 flex-col empty:hidden">
      {storageWarning === undefined ? undefined : (
        <Banner>
          <p className="text-warning">{storageWarning}</p>
        </Banner>
      )}
      {backup === undefined ? undefined : (
        <BackupBanner backup={backup} onDiscardClick={handleDiscardClick} />
      )}
      <RejectedFileBanner />
    </div>
  );
}

function Banner({ children }: { readonly children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted px-4 py-2"
      role="alert"
    >
      {children}
    </div>
  );
}

function describeBackup(backup: KeptBackup): string {
  if (backup.origin === 'earlier' || backup.reason === undefined) {
    return 'Damaged project data from an earlier visit is still kept in this browser.';
  }
  return `The project saved in this browser could not be read (${DAMAGE_REASON_TEXT[backup.reason]}). A new project was started; the damaged data is kept.`;
}

type BackupBannerProps = {
  readonly backup: KeptBackup;
  readonly onDiscardClick: () => void;
};

function BackupBanner({ backup, onDiscardClick }: BackupBannerProps) {
  const { downloadKeptBackup } = useProject();

  function handleDownloadClick() {
    downloadKeptBackup();
  }

  function handleDiscardClick() {
    onDiscardClick();
  }

  return (
    <Banner>
      <p>{describeBackup(backup)}</p>
      <Button onClick={handleDownloadClick} size="sm" variant="secondary">
        Download damaged data
      </Button>
      <Button onClick={handleDiscardClick} size="sm" variant="secondary">
        Discard damaged data…
      </Button>
    </Banner>
  );
}

function RejectedFileBanner() {
  const { rejectedFile, dismissRejectedFile } = useProject();
  if (rejectedFile === undefined) {
    return null;
  }
  const { title, lines } = formatProjectFileError(rejectedFile);

  function handleDismissClick() {
    dismissRejectedFile();
  }

  return (
    <Banner>
      <div className="flex flex-col gap-1">
        <p className="text-danger">{title}</p>
        {lines.length === 0 ? undefined : (
          <ul className="list-disc pl-5">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      <Button className="ml-auto" onClick={handleDismissClick} size="sm" variant="secondary">
        Dismiss
      </Button>
    </Banner>
  );
}
