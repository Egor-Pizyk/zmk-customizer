// oxlint-disable-next-line import/default -- Vite supplies this virtual module's Worker constructor; the source is a worker entry.
import RoutingWorker from './wiring-worker?worker&inline';
import type { WiringWorkerRequest, WiringWorkerReply } from './wiring-worker-protocol';

type Callbacks = {
  readonly onReply: (reply: WiringWorkerReply) => void;
  readonly onFailure: (message: string) => void;
};
export type WiringWorkerTask = { readonly cancel: () => void };

export function startWiringWorker(
  input: WiringWorkerRequest,
  callbacks: Callbacks,
): WiringWorkerTask {
  if (typeof Worker === 'undefined') {
    callbacks.onFailure('Routing workers are unavailable in this browser.');
    return {
      cancel: () => {
        /* No worker was created. */
      },
    };
  }
  try {
    return connectWorker(input, callbacks);
  } catch (error) {
    if (!(error instanceof DOMException)) {
      throw error;
    }
    callbacks.onFailure(`Cannot start routing worker: ${error.message}`);
    return {
      cancel: () => {
        /* No worker was created. */
      },
    };
  }
}

function connectWorker(input: WiringWorkerRequest, callbacks: Callbacks): WiringWorkerTask {
  const worker = new RoutingWorker();
  let isStopped = false;
  const listeners = createListeners(callbacks, stop);
  function stop(): boolean {
    if (isStopped) {
      return false;
    }
    isStopped = true;
    worker.removeEventListener('message', listeners.message);
    worker.removeEventListener('error', listeners.error);
    worker.removeEventListener('messageerror', listeners.messageerror);
    worker.terminate();
    return true;
  }
  worker.addEventListener('message', listeners.message);
  worker.addEventListener('error', listeners.error);
  worker.addEventListener('messageerror', listeners.messageerror);
  try {
    worker.postMessage(input, []);
  } catch (error) {
    stop();
    throw error;
  }
  return {
    cancel: () => {
      stop();
    },
  };
}

function createListeners(callbacks: Callbacks, stop: () => boolean) {
  return {
    message: (event: MessageEvent<WiringWorkerReply>) => {
      if (stop()) {
        callbacks.onReply(event.data);
      }
    },
    error: (event: ErrorEvent) => {
      event.preventDefault();
      if (stop()) {
        callbacks.onFailure(event.message || 'The routing worker failed. Recalculate the preview.');
      }
    },
    messageerror: () => {
      if (stop()) {
        callbacks.onFailure(
          'The routing worker could not return its result. Recalculate the preview.',
        );
      }
    },
  };
}
