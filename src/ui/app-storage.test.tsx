// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  loadProject,
  PROJECT_STORAGE_KEY,
  PROJECT_BACKUP_STORAGE_KEY,
} from '../storage/project-storage';
import { renderApp } from '../../tests/helpers/render-app';
import { expect, it, vi } from 'vitest';
import { createProject } from '../domain/create-project';
import { ProjectProvider, useProject } from './project-context';
import { ProjectBar } from './shell/project-bar';
import { ProjectMessages } from './shell/project-messages';

function handleUnusedClick() {
  /* No modal is needed in the storage contract harness. */
}
function SaveHarness() {
  const { commit, project } = useProject();
  function handleInvalidClick() {
    commit((current) => ({
      ...current,
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k1', xU: 1, yU: 0 },
      ],
    }));
  }
  return (
    <>
      <ProjectBar onNewClick={handleUnusedClick} onOpenClick={handleUnusedClick} />
      <ProjectMessages onDiscardClick={handleUnusedClick} />
      <button onClick={handleInvalidClick} type="button">
        Trigger invalid edit
      </button>
      <output aria-label="In-memory keys">{project.keys.length}</output>
    </>
  );
}

it('shows the structural save reason, keeps the current project in memory, and repairs it with Undo', async () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  render(
    <ProjectProvider
      initialLoad={{
        project: createProject({ controllerId: 'nice_nano_v2' }),
        status: { kind: 'ok' },
      }}
    >
      <SaveHarness />
    </ProjectProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Trigger invalid edit' }));
  expect(screen.getByRole('alert').textContent).toContain('keys.1.id');
  expect(screen.getByRole('alert').textContent).toContain('Undo the last change');
  expect(screen.getByRole('alert').textContent).not.toContain('browser storage is blocked');
  expect(screen.getByLabelText('In-memory keys').textContent).toBe('2');
  expect(setItem).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText('In-memory keys').textContent).toBe('0');
  expect(setItem).toHaveBeenCalledOnce();
});

it.each([
  { name: 'QuotaExceededError', message: 'browser storage is full' },
  { name: 'SecurityError', message: 'does not let the app store' },
])('explains $name while leaving the changed project in memory', async ({ name, message }) => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('denied', name);
  });
  render(
    <ProjectProvider
      initialLoad={{
        project: createProject({ controllerId: 'nice_nano_v2' }),
        status: { kind: 'ok' },
      }}
    >
      <SaveHarness />
    </ProjectProvider>,
  );
  const user = userEvent.setup();
  const field = screen.getByRole('textbox', { name: 'Name' });
  await user.clear(field);
  await user.type(field, 'Edited{Enter}');
  expect(screen.getByRole('alert').textContent).toContain(message);
  expect(field).toHaveProperty('value', 'Edited');
});

it('keeps damaged bytes through cancelled discard and resumes saving after confirmed discard', async () => {
  const app = renderApp();
  app.unmount();
  localStorage.setItem(PROJECT_STORAGE_KEY, '{damaged');
  app.mount();
  expect(screen.getByRole('alert').textContent).toContain('damaged');
  await app.user.click(screen.getByRole('button', { name: /Discard damaged/u }));
  await app.user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(loadProject().backupText).toBe('{damaged');
  await app.user.click(screen.getByRole('button', { name: /Discard damaged/u }));
  await app.user.click(screen.getByRole('button', { name: /^Discard damaged data$/u }));
  expect(localStorage.getItem(PROJECT_BACKUP_STORAGE_KEY)).toBeNull();
  const name = screen.getByRole('textbox', { name: 'Name' });
  await app.user.clear(name);
  await app.user.type(name, 'Recovered{Enter}');
  expect(loadProject().project.name).toBe('Recovered');
});
