import { expect, test } from './test';
import { openProject, saved } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`lower navigation hints ${colorScheme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await openProject(page);
    const before = await saved(page);
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const name of ['Settings', 'Take the tour again', 'Keyboard shortcuts']) {
        const button = page
          .getByRole('navigation', { name: 'Workspaces' })
          .getByRole('button', { name, exact: true });
        const hint = button.getByRole('tooltip', { includeHidden: true });
        await page.getByRole('heading', { name: 'Schematic', level: 1 }).focus();
        await button.hover();
        await expect(hint).toBeVisible();
        await expect(hint).toHaveText(name);
        const bounds = await hint.boundingBox();
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect(bounds?.y).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? width) + (bounds?.width ?? 1)).toBeLessThanOrEqual(width);
        expect((bounds?.y ?? 800) + (bounds?.height ?? 1)).toBeLessThanOrEqual(800);
        await page.screenshot({ path: test.info().outputPath(`${width}-${name}.png`) });
        await page.mouse.move(width - 1, 0);
        await expect(hint).toBeHidden();
        await button.focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(hint).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(hint).toBeHidden();
        await page.keyboard.press('Tab');
      }
    }
    expect(await saved(page)).toEqual(before);
  });
}
