import { ImmediateRoutingWorker } from './immediate-routing-worker';
import { vi } from 'vitest';

export function installPlatformShims() {
  if (typeof Worker === 'undefined') {
    vi.stubGlobal('Worker', ImmediateRoutingWorker);
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value() {
      // jsdom has no layout/scroll engine; real geometry is checked in Playwright.
    },
  });
  // jsdom has no layout engine or native modal implementation. These shims only
  // allow React to mount; tests make no claims about painting or native focus traps.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        // Layout is unavailable in jsdom.
      }
      disconnect() {
        // No observer resources are created.
      }
    },
  );
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    },
  });
}
