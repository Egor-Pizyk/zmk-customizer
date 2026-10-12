import { useRef } from 'react';
import type { ChangeEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { Button } from '../components/button';
import { Dialog } from '../components/dialog';
import { useProject } from '../project-context';

type ProjectDialogsProps = {
  readonly isNewDialogOpen: boolean;
  readonly isOpenDialogOpen: boolean;
  readonly isDiscardDialogOpen: boolean;
  readonly onClose: () => void;
};

const REPLACE_WARNING =
  'The current project will be replaced. Save it to a file first if you want to keep it.';

// Confirms what undo cannot restore (admin-ui.md "Destructive actions"; research R16).
export function ProjectDialogs({
  isNewDialogOpen,
  isOpenDialogOpen,
  isDiscardDialogOpen,
  onClose,
}: ProjectDialogsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    onClose();
  }

  return (
    <>
      <ProjectFileInput inputRef={fileInputRef} />
      <OpenProjectDialog
        fileInputRef={fileInputRef}
        isOpen={isOpenDialogOpen}
        onClose={handleClose}
      />
      <NewProjectDialog isOpen={isNewDialogOpen} onClose={handleClose} />
      <DiscardBackupDialog isOpen={isDiscardDialogOpen} onClose={handleClose} />
    </>
  );
}

type ConfirmDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

function OpenProjectDialog({
  isOpen,
  onClose,
  fileInputRef,
}: ConfirmDialogProps & { readonly fileInputRef: RefObject<HTMLInputElement | null> }) {
  function handleClose() {
    onClose();
  }

  // Close the modal synchronously first: while it is open the page (and the input) is inert.
  function handleChooseFileClick(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.closest('dialog')?.close();
    fileInputRef.current?.click();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Open a project file?">
      <p>{REPLACE_WARNING}</p>
      <DialogButtons hasSaveButton onCancel={handleClose}>
        <Button onClick={handleChooseFileClick} variant="primary">
          Choose file…
        </Button>
      </DialogButtons>
    </Dialog>
  );
}

function NewProjectDialog({ isOpen, onClose }: ConfirmDialogProps) {
  const { startNewProject, startPresetProject } = useProject();

  function handleClose() {
    onClose();
  }

  function handlePresetClick() {
    startPresetProject();
    onClose();
  }

  function handleStartNewClick() {
    startNewProject();
    onClose();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Start a new project?">
      <p>{REPLACE_WARNING}</p>
      <DialogButtons hasSaveButton onCancel={handleClose}>
        <Button onClick={handleStartNewClick} variant="danger">
          Start new project
        </Button>
        <Button onClick={handlePresetClick} variant="primary">
          Start six-key unibody preset
        </Button>
      </DialogButtons>
    </Dialog>
  );
}

function DiscardBackupDialog({ isOpen, onClose }: ConfirmDialogProps) {
  const { discardKeptBackup } = useProject();

  function handleClose() {
    onClose();
  }

  function handleDiscardClick() {
    discardKeptBackup();
    onClose();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Discard damaged data?">
      <p>It cannot be recovered afterwards.</p>
      <DialogButtons onCancel={handleClose}>
        <Button onClick={handleDiscardClick} variant="danger">
          Discard damaged data
        </Button>
      </DialogButtons>
    </Dialog>
  );
}

type DialogButtonsProps = {
  /** Offers "Save to file" before a replacing action. */
  readonly hasSaveButton?: boolean;
  readonly onCancel: () => void;
  readonly children: ReactNode;
};

function DialogButtons({ hasSaveButton = false, onCancel, children }: DialogButtonsProps) {
  const { saveProjectFile } = useProject();

  function handleSaveClick() {
    saveProjectFile();
  }

  function handleCancelClick() {
    onCancel();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {hasSaveButton ? (
        <Button onClick={handleSaveClick} variant="secondary">
          Save to file
        </Button>
      ) : undefined}
      {children}
      <Button onClick={handleCancelClick} variant="secondary">
        Cancel
      </Button>
    </div>
  );
}

type ProjectFileInputProps = {
  readonly inputRef: RefObject<HTMLInputElement | null>;
};

// Outside every <dialog>: Dialog unmounts its children when closed, which would drop `change`.
function ProjectFileInput({ inputRef }: ProjectFileInputProps) {
  const { openProjectFile, announce } = useProject();

  // Cancelling the picker fires no change event; reset so the same file can be chosen again.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (file === undefined) {
      return;
    }
    openProjectFile(file).catch(() => {
      announce('Could not open the file.');
    });
  }

  return (
    <input
      accept=".json,application/json"
      aria-hidden="true"
      className="hidden"
      onChange={handleChange}
      ref={inputRef}
      tabIndex={-1}
      type="file"
    />
  );
}
