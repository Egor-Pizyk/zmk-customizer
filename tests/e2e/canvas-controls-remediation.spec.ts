import { expect, test } from './test';
import { fixture, openProject, saved, history, key, center } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`canvas controls and Key Escape in ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page);
    const canvas = page.locator('[data-canvas-workspace="schematic"]');
    await canvas.press('k');
    await expect(page.getByRole('radio', { name: 'Key', exact: true })).toBeChecked();
    await canvas.press('Escape');
    await expect(page.getByRole('radio', { name: 'Select', exact: true })).toBeChecked();
    const point = await center(key(page));
    await page.mouse.click(point.x, point.y);
    await expect(page.getByRole('checkbox', { name: 'Select key 0', exact: true })).toBeChecked();
    expect(await saved(page)).toEqual(fixture);
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Reset view', exact: true })).toHaveCount(0);
    await canvas.press('+');
    const zoomed = await key(page).boundingBox();
    await canvas.press('0');
    expect(await key(page).boundingBox()).toEqual(zoomed);
    await canvas.press('k');
    const settings = page.getByRole('button', { name: 'Settings', exact: true });
    await settings.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(settings).toBeFocused();
    await expect(page.getByRole('radio', { name: 'Key', exact: true })).toBeChecked();
    await canvas.press('Escape');
    await page.getByRole('radio', { name: 'Key', exact: true }).press('Space');
    await expect(canvas).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('radio', { name: 'Select', exact: true })).toBeChecked();
    await page.getByText('Wiring', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Complete wiring', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Rebuild wiring', exact: true })).toBeVisible();
    await page
      .getByRole('button', { name: 'Rebuild wiring', exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('canvas-controls.png') });
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
    await page
      .getByRole('button', { name: 'Rebuild wiring', exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('canvas-controls-narrow.png') });
    await page.getByRole('button', { name: 'Bindings', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reset view', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Center keyboard', exact: true })).toBeVisible();
    expect(await saved(page)).toEqual(fixture);
  });
}
