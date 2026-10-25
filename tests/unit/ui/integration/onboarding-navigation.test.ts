// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { ONBOARDING_SESSION_KEY, ONBOARDING_SHOWN_KEY, saveOnboarding } from '@storage/onboarding';
import { createProject } from '@domain/project';
import { PROJECT_STORAGE_KEY } from '@storage/project';

it('offers the tour once under StrictMode and skip never touches current project', async () => {
  const app = renderApp();
  app.unmount();
  localStorage.removeItem(ONBOARDING_SHOWN_KEY);
  const original = localStorage.getItem(PROJECT_STORAGE_KEY);
  const mounted = app.mount();
  expect(screen.getByRole('dialog', { name: 'Learn ZMK Customizer' })).toBeTruthy();
  await waitFor(() => {
    expect(localStorage.getItem(ONBOARDING_SHOWN_KEY)).toContain('true');
  });
  await app.user.click(screen.getByRole('button', { name: 'Skip tour' }));
  mounted.unmount();
  app.mount();
  expect(screen.queryByRole('dialog', { name: 'Learn ZMK Customizer' })).toBeNull();
  expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(original);
});
it('protects original edits, supports Back and returns safely through exit dialog', async () => {
  const app = renderApp();
  const original = localStorage.getItem(PROJECT_STORAGE_KEY);
  await app.user.click(screen.getByRole('button', { name: 'Take the tour again' }));
  await app.user.click(screen.getByRole('button', { name: 'Start empty learning project' }));
  const name = screen.getByRole('textbox', { name: 'Name' });
  await app.user.clear(name);
  await app.user.type(name, 'My macropad{Enter}');
  expect(screen.getByRole('heading', { name: 'Place nine keys' })).toBeTruthy();
  await app.user.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('heading', { name: 'Name your macropad' })).toBeTruthy();
  await app.user.click(screen.getByRole('button', { name: 'Confirm and continue' }));
  await app.user.click(screen.getByRole('button', { name: 'Exit tour' }));
  await app.user.click(screen.getByRole('button', { name: 'Cancel' }));
  await app.user.click(screen.getByRole('button', { name: 'Exit tour' }));
  await app.user.click(screen.getByRole('button', { name: 'Save learning session and exit' }));
  expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(original);
  expect(localStorage.getItem(ONBOARDING_SESSION_KEY)).toContain('My macropad');
});
it('requires confirmation before replacing a retained draft and offers corrupted-data recovery', async () => {
  const app = renderApp();
  saveOnboarding({
    version: 1,
    tutorialRevision: 1,
    project: createProject({ controllerId: 'nice_nano_v2' }),
    stepId: 'name',
    acknowledgedStepIds: [],
    outcome: 'closed',
  });
  await app.user.click(screen.getByRole('button', { name: 'Take the tour again' }));
  const dialog = screen.getByRole('dialog', { name: 'Learn ZMK Customizer' });
  await app.user.click(
    within(dialog).getByRole('button', { name: 'Start empty learning project' }),
  );
  expect(within(dialog).getByText(/replaces only the retained/u)).toBeTruthy();
  await app.user.click(within(dialog).getByRole('button', { name: 'Skip tour' }));
  localStorage.setItem(ONBOARDING_SESSION_KEY, '{broken');
  await app.user.click(screen.getByRole('button', { name: 'Take the tour again' }));
  expect(screen.getByRole('button', { name: 'Download saved learning data' })).toBeTruthy();
  await app.user.click(screen.getByRole('button', { name: 'Discard unreadable learning session' }));
  expect(localStorage.getItem(ONBOARDING_SESSION_KEY)).toBeNull();
});
