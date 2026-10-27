import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { ProjectProvider } from '@ui/project/components';
import { loadProject } from '@storage/project';

export function ProjectHarness({ children }: { readonly children: ReactNode }) {
  return (
    <StrictMode>
      <ProjectProvider initialLoad={loadProject()}>{children}</ProjectProvider>
    </StrictMode>
  );
}
