import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from '@ui/app';
import { PreferencesProvider } from '@ui/preferences';
import { ProjectProvider } from '@ui/project';
import { loadProject, saveProject } from '@storage/project';
import { UNIBODY_PRESET } from '@catalog/presets';
import { DEFAULT_PREFERENCES, savePreferences } from '@storage/preferences';
import type { Preferences } from '@storage/preferences';

type Project = ReturnType<typeof loadProject>['project'];

export function renderApp(
  project: Project = UNIBODY_PRESET,
  preferences: Partial<Preferences> = {},
) {
  installPlatformShims();
  saveProject(project);
  savePreferences({
    ...DEFAULT_PREFERENCES,
    isPartsListOpen: true,
    isBindingsTableOpen: true,
    ...preferences,
  });
  const user = userEvent.setup();
  return { user, ...mount(), mount };
}

function mount() {
  return render(
    <StrictMode>
      <PreferencesProvider>
        <ProjectProvider initialLoad={loadProject()}>
          <App />
        </ProjectProvider>
      </PreferencesProvider>
    </StrictMode>,
  );
}

function installPlatformShims() {
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
