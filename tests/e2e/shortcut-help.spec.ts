import { expect, test } from './test';
import { openProject } from './helpers';

for (const width of [640, 1024, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Keyboard shortcuts fits ${width}px ${colorScheme} @cross-browser`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme });
      await openProject(page);
      const opener = page.getByRole('button', { name: 'Keyboard shortcuts', exact: true });
      await opener.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts', exact: true });
      await expect(dialog).toBeVisible();
      expect(
        await dialog.evaluate((element) =>
          [...element.querySelectorAll('*'), element]
            .filter((child) => child.clientWidth > 0 && child.scrollWidth > child.clientWidth)
            .map((child) => ({
              tag: child.tagName,
              width: child.clientWidth,
              scrollWidth: child.scrollWidth,
              display: getComputedStyle(child).display,
            })),
        ),
      ).toEqual([]);
      await expect(dialog.getByRole('table', { name: 'Pointer', exact: true })).toBeVisible();
      await dialog.getByRole('cell', { name: 'Pan', exact: true }).first().scrollIntoViewIfNeeded();
      await expect(dialog.getByRole('cell', { name: 'Pan', exact: true }).first()).toBeInViewport();
      await page.screenshot({ path: `test-results/shortcut-help-${width}-${colorScheme}.png` });
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    });
  }
}
