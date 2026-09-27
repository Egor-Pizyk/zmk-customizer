import { useEffect, useEffectEvent, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { CloseIcon } from './icons/close-icon';
import { IconButton } from './icon-button';

type DialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
};

// Native <dialog>: focus trap, inert page, Escape and focus return come from the browser (R8).
export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useModalDialog(dialogRef, isOpen, onClose);

  function handleCloseClick() {
    onClose();
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="m-auto w-full max-w-md rounded-lg border border-border bg-surface-raised text-text backdrop:bg-text/40"
      ref={dialogRef}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold" id={titleId}>
            {title}
          </h2>
          <IconButton icon={<CloseIcon />} label="Close" onClick={handleCloseClick} />
        </div>
        {isOpen ? children : undefined}
      </div>
    </dialog>
  );
}

function useModalDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  const handleClose = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    let isPressOnBackdrop = false;
    // A target equal to the <dialog> itself means the backdrop. Both press and release must be
    // there, so a text selection dragged out of the dialog does not close it.
    function handleBackdropPointerDown(event: PointerEvent) {
      isPressOnBackdrop = event.target === dialog;
    }
    function handleBackdropClick(event: MouseEvent) {
      if (isPressOnBackdrop && event.target === dialog) {
        handleClose();
      }
    }
    dialog?.addEventListener('pointerdown', handleBackdropPointerDown);
    dialog?.addEventListener('click', handleBackdropClick);
    dialog?.addEventListener('close', handleClose);
    return () => {
      dialog?.removeEventListener('pointerdown', handleBackdropPointerDown);
      dialog?.removeEventListener('click', handleBackdropClick);
      dialog?.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog?.open === false) {
      dialog.showModal();
    }
    if (!isOpen && dialog?.open === true) {
      dialog.close();
    }
  }, [dialogRef, isOpen]);
}
