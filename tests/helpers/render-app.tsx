import { installPlatformShims } from './app-platform';
import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
