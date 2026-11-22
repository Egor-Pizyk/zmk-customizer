import { expect, test } from './test';
import { fixture, openProject, saved, history } from './helpers';

test('Bindings omits Snap while shared Settings and Schematic persist it', async ({ page }) => {
  await openProject(page);
  const snap = page.getByRole('button', { name: 'Snap to grid', exact: true });
  await snap.click();
  await page.getByRole('button', { name: /^Bindings/u }).click();
  await expect(snap).toHaveCount(0);
  await expect(page.getByText('Snap off', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const setting = page.getByRole('switch', { name: 'Snap to grid', exact: true });
  await expect(setting).not.toBeChecked();
  await setting.check();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bindings', exact: true })).toBeVisible();
  await expect(snap).toHaveCount(0);
  await expect(page.getByText('Snap on', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Schematic/u }).click();
  await expect(snap).toHaveAttribute('aria-pressed', 'true');
  expect(await saved(page)).toEqual(fixture);
  await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
});
