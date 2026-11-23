import type { WiringWorkerTask } from './wiring-worker-transport';

/** Transport ownership only; Project and displayed draft stay in useWiringPreview. */
export function createWiringWorkerSession() {
  let request = 0;
  let isClaimed = false;
  let task: WiringWorkerTask | undefined;
  let opener: Element | null = null;
  function cancel() {
    request += 1;
    isClaimed = false;
    task?.cancel();
    task = undefined;
  }
  return {
    cancel,
    captureFocus: (element: Element | null) => {
      opener = element;
    },
    restoreFocus: () => {
      restoreFocus(opener);
    },
    begin: () => {
      cancel();
      return request;
    },
    isCurrent: (id: number) => request === id,
    attach: (id: number, next: WiringWorkerTask) => {
      if (request === id) {
        task = next;
      } else {
        next.cancel();
      }
    },
    claim: (id: number) => {
      if (request !== id || isClaimed) {
        return false;
      }
      isClaimed = true;
      return true;
    },
  };
}

function restoreFocus(opener: Element | null) {
  if (opener instanceof HTMLElement && opener.isConnected) {
    opener.focus();
  }
}
