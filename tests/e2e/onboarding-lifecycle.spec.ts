import { expect, test } from '@playwright/test';
import { importText, fixture, saved } from './helpers';

test('onboarding first display, skip, replay, protected edits and reload @cross-browser', async ({
  page,
}) => {
  await page.goto('/');
  const welcome = page.getByRole('dialog', { name: 'Learn ZMK Customizer' });
  await expect(welcome).toBeVisible();
  await welcome.getByRole('button', { name: 'Skip tour', exact: true }).click();
  await page.reload();
  await expect(welcome).not.toBeVisible();
  await importText(page, JSON.stringify(fixture));
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Original edit');
  await page.getByRole('textbox', { name: 'Name', exact: true }).press('Enter');
  const original = await saved(page);
  await page.getByRole('button', { name: 'Take the tour again' }).click();
  await welcome.getByRole('button', { name: 'Start empty learning project' }).click();
  await expect(page.getByRole('heading', { name: 'Name your macropad' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('My macropad');
  await page.getByRole('textbox', { name: 'Name', exact: true }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Place nine keys' })).toBeVisible();
  expect(await saved(page)).toEqual(original);
  await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
  await page.getByRole('button', { name: 'Save learning session and exit' }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(
    'Original edit',
  );
  await page.getByRole('button', { name: /^Undo/u }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(fixture.name);
  await page.getByRole('button', { name: 'Take the tour again' }).click();
  await welcome.getByRole('button', { name: 'Resume learning session' }).click();
  await expect(page.getByRole('heading', { name: 'Place nine keys' })).toBeVisible();
  await page.reload();
  await expect(welcome).not.toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(fixture.name);
});
