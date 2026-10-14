import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadProject } from '@storage/project';
import { App, ErrorBoundary } from '@ui/app/components';
import { PreferencesProvider } from '@ui/preferences';
import { ProjectProvider } from '@ui/project/components';

const rootElement = document.querySelector('#root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

// Once, outside React: StrictMode runs initializers twice and loading may write the backup (R7).
const initialLoad = loadProject();

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <PreferencesProvider>
        <ProjectProvider initialLoad={initialLoad}>
          <App />
        </ProjectProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  </StrictMode>,
);
