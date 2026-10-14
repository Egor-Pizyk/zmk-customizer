import { renameProject, setShieldName, toShieldName } from '@domain/project';
import { Button } from '@ui/components/components';
import { useProject } from '@ui/project/logic';
import type { SaveStatus } from '@ui/project/logic';
import { DraftTextField } from './draft-text-field';

const SAVE_STATUS_TEXT: Record<SaveStatus, string> = {
  saved: 'Saved in this browser',
  'invalid-project': 'Not saved: project data needs repair',
  unavailable: 'Not saved: browser storage is blocked',
  'quota-exceeded': 'Not saved: browser storage is full',
  'backup-blocked': 'Not saved: damaged data from an earlier visit is still kept',
};

type ProjectBarProps = {
  readonly onNewClick: () => void;
  readonly onOpenClick: () => void;
};

// Wraps instead of a fixed height, so issue text and 200% zoom never clip (accessibility.md).
export function ProjectBar({ onNewClick, onOpenClick }: ProjectBarProps) {
  const { saveStatus } = useProject();

  function handleNewClick() {
    onNewClick();
  }

  function handleOpenClick() {
    onOpenClick();
  }

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-end gap-3 border-b border-border bg-surface-raised px-4 py-2">
      <ProjectNameFields />
      <span className="self-center text-text-muted">{SAVE_STATUS_TEXT[saveStatus]}</span>
      <ProjectActions onNewClick={handleNewClick} onOpenClick={handleOpenClick} />
    </header>
  );
}

function ProjectNameFields() {
  const { project, issues, commit } = useProject();

  function issueTextAt(field: 'name' | 'shieldName'): string | undefined {
    const messages = issues
      .filter((issue) => issue.path[0] === field)
      .map((issue) => issue.message);
    return messages.length === 0 ? undefined : messages.join(' ');
  }

  function handleNameCommit(name: string) {
    commit((current) => renameProject(current, { name }));
  }

  // An empty technical name clears the override: derive it from the name again (FR-012a).
  function handleShieldNameCommit(text: string) {
    commit((current) => setShieldName(current, { shieldName: text === '' ? undefined : text }));
  }

  return (
    <>
      <DraftTextField
        error={issueTextAt('name')}
        issuePath="name"
        label="Name"
        onCommit={handleNameCommit}
        value={project.name}
      />
      <DraftTextField
        error={issueTextAt('shieldName')}
        issuePath="shieldName"
        label="Technical name"
        onCommit={handleShieldNameCommit}
        placeholder={toShieldName(project.name)}
        value={project.shieldName ?? ''}
      />
    </>
  );
}

function ProjectActions({ onNewClick, onOpenClick }: ProjectBarProps) {
  const { saveProjectFile } = useProject();

  function handleNewClick() {
    onNewClick();
  }

  function handleOpenClick() {
    onOpenClick();
  }

  function handleSaveClick() {
    saveProjectFile();
  }

  return (
    <div className="ml-auto flex gap-1 self-center">
      <Button onClick={handleNewClick} size="sm">
        New
      </Button>
      <Button onClick={handleOpenClick} size="sm">
        Open
      </Button>
      <Button onClick={handleSaveClick} size="sm">
        Save
      </Button>
      <HistoryButtons />
    </div>
  );
}

function HistoryButtons() {
  const { canUndo, canRedo, undo, redo } = useProject();

  function handleUndoClick() {
    undo();
  }

  function handleRedoClick() {
    redo();
  }

  return (
    <>
      <Button
        hint={canUndo ? undefined : 'Nothing to undo'}
        isDisabled={!canUndo}
        onClick={handleUndoClick}
        size="sm"
      >
        Undo
      </Button>
      <Button
        hint={canRedo ? undefined : 'Nothing to redo'}
        isDisabled={!canRedo}
        onClick={handleRedoClick}
        size="sm"
      >
        Redo
      </Button>
    </>
  );
}
