import { expect, test } from './test';
import { fixture, openProject, saved, history, importText } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`canvas hints ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page);
    for (const workspace of ['Schematic', 'Bindings']) {
      await page.getByRole('button', { name: new RegExp(`^${workspace}`, 'u') }).click();
      for (const width of workspace === 'Schematic' ? [1440, 1024, 390] : [1440, 1024]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const name of workspace === 'Schematic'
          ? ['Snap to grid', 'Zoom in', 'Zoom out', 'Center keyboard']
          : ['Zoom in', 'Zoom out', 'Center keyboard']) {
          const button = page.getByRole('button', { name, exact: true });
          await button.hover();
          const hint = button.getByRole('tooltip', { includeHidden: true });
          await expect(hint).toBeVisible();
          const bounds = await hint.boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds?.x).toBeGreaterThanOrEqual(0);
          expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
          await page.mouse.move(0, 0);
          await button.focus();
          await page.keyboard.press('Shift+Tab');
          await page.keyboard.press('Tab');
          await expect(hint).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(hint).toBeHidden();
          await page.keyboard.press('Tab');
        }
      }
      const snap = page.getByRole('button', { name: 'Snap to grid', exact: true });
      if (workspace === 'Bindings') {
        await expect(snap).toHaveCount(0);
      } else {
        await snap.focus();
        await expect(snap).toHaveAttribute('aria-pressed', 'true');
        await expect(snap.getByRole('tooltip', { includeHidden: true })).toHaveText(
          'Snapping on. Disable snapping',
        );
        await page.keyboard.press('Space');
        await expect(snap).toHaveAttribute('aria-pressed', 'false');
        await expect(snap.getByRole('tooltip', { includeHidden: true })).toHaveText(
          'Snapping off. Enable snapping',
        );
        await page.keyboard.press('Space');
      }
      await page.screenshot({ path: test.info().outputPath(`${workspace}-hints.png`) });
    }
    expect(await saved(page)).toEqual(fixture);
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
  });
}

test('empty canvas center hint stays keyboard reachable @cross-browser', async ({ page }) => {
  await page.goto('/');
  await importText(
    page,
    JSON.stringify({
      ...fixture,
      keys: [],
      wires: [],
      layers: fixture.layers.map((layer) => ({ ...layer, bindings: {} })),
    }),
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const button = page.getByRole('button', { name: 'Center keyboard', exact: true });
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button.getByRole('tooltip')).toHaveText('Add a key to center the keyboard');
  await expect(button.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
});

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
