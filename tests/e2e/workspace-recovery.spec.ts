import { expect, test } from './test';
import { history, openPartsGroups, openProject, saved, workspace } from './helpers';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';

test('empty Bindings returns to the first-key and KLE paths in Schematic @cross-browser', async ({
  page,
}) => {
  await page.goto('/');
  await workspace(page, 'Bindings');
  const back = page.getByRole('button', { name: 'Go to Schematic', exact: true });
  await back.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByText('Custom behaviors', { exact: true })).toBeFocused();
  await back.press('Enter');
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).press('Enter');
  await expect(page.getByText('Import KLE layout', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await openPartsGroups(page, ['Keys']);
  const add = page.getByRole('button', { name: 'Add key', exact: true });
  await add.press('Enter');
  await expect.poll(async () => (await saved(page)).keys.length).toBe(1);
  await history(page, 'Undo').press('Enter');
  await expect(add).toBeVisible();
  await expect.poll(async () => (await saved(page)).keys.length).toBe(0);
});

test('blocked export puts a repair first and opens the first-key action @cross-browser', async ({
  page,
  browserName,
}) => {
  await page.goto('/');
  await workspace(page, 'Export');
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  const issue = page.getByRole('button', { name: /project has no keys/u });
  await expect(issue).toBeFocused();
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: 'Include GitHub Actions workflow' })).toHaveCount(
    0,
  );
  await issue.press('Enter');
  await expect(page.getByRole('button', { name: 'Add key', exact: true })).toBeFocused();
});

test('the populated Bindings workspace presents the active layer before optional editors', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Bindings');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tab', { selected: true })).toBeFocused();
});

test('clearing a firmware search restores typing focus @cross-browser', async ({ page }) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Firmware');
  const search = page.getByRole('searchbox', { name: 'Search firmware settings' });
  const clear = page.getByRole('button', { name: 'Clear search', exact: true });
  await expect(clear).toBeDisabled();
  await search.fill('no-results');
  await expect(page.getByText('No firmware settings match your search.')).toBeVisible();
  await clear.press('Enter');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(clear).toBeDisabled();
  await page.keyboard.type('debounce');
  await expect(search).toHaveValue('debounce');
});
