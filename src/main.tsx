import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadProject } from './storage/project-storage';
import { App } from './ui/app';
import { ErrorBoundary } from './ui/error-boundary';
import { PreferencesProvider } from './ui/preferences-context';
import { ProjectProvider } from './ui/project-context';

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
