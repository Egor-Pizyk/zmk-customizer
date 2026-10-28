import { installPlatformShims } from './app-platform';
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
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
