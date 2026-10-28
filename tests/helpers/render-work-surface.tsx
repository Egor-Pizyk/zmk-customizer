import { render } from '@testing-library/react';
import { WorkSurface } from '@ui/canvas/components';
import type { SurfaceContent } from '@ui/canvas/logic';
import type { CanvasWorkspaceId } from '@storage/preferences';
import { PreferencesProvider } from '@ui/preferences';
import { ProjectProvider } from '@ui/project/components';
import { loadProject } from '@storage/project';
import { installPlatformShims } from './app-platform';

export function renderWorkSurface(workspaceId: CanvasWorkspaceId, content: SurfaceContent) {
  installPlatformShims();
  return render(
    <PreferencesProvider>
      <ProjectProvider initialLoad={loadProject()}>
        <WorkSurface workspaceId={workspaceId} content={content} />
      </ProjectProvider>
    </PreferencesProvider>,
  );
}
