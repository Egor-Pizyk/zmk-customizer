import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from '@ui/app/components';
import { PreferencesProvider } from '@ui/preferences';
import { ProjectProvider } from '@ui/project/components';
import { loadProject, saveProject } from '@storage/project';
import { UNIBODY_PRESET } from './unibody-preset';
import { DEFAULT_PREFERENCES, savePreferences } from '@storage/preferences';
import type { Preferences } from '@storage/preferences';

type Project = ReturnType<typeof loadProject>['project'];

export function renderApp(
  project: Project = UNIBODY_PRESET,
  preferences: Partial<Preferences> = {},
  partsGroups: readonly string[] = ['Keys', 'Wire sections', 'Wires', 'Crossings'],
) {
  installPlatformShims();
  localStorage.setItem('zmk-customizer:onboarding-shown', '{"version":1,"hasBeenShown":true}');
  saveProject(project);
  savePreferences({
    ...DEFAULT_PREFERENCES,
    isPartsListOpen: true,
    isBindingsTableOpen: true,
    ...preferences,
  });
  const user = userEvent.setup();
  return { user, ...mount(partsGroups), mount: () => mount(partsGroups) };
}

function mount(partsGroups: readonly string[]) {
  const result = render(
    <StrictMode>
      <PreferencesProvider>
        <ProjectProvider initialLoad={loadProject()}>
          <App />
        </ProjectProvider>
      </PreferencesProvider>
    </StrictMode>,
  );
  // Editing fixtures explicitly open their controls. Default-state tests pass an empty list.
  act(() => {
    for (const name of partsGroups) {
      const summary = result.queryByRole('heading', { name, level: 3 })?.closest('summary');
      if (summary !== null && summary !== undefined) {
        fireEvent.click(summary);
      }
    }
  });
  return result;
}

function installPlatformShims() {
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
