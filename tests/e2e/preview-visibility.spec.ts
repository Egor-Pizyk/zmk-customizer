import { expect, test } from './test';
import type { Locator, Page } from '@playwright/test';
import { openProject, saved } from './helpers';

async function expectPainted(control: Locator) {
  await expect(control).toBeVisible();
  await expect
    .poll(() =>
      control.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
        );
      }),
    )
    .toBe(true);
}

async function scrollEditors(page: Page, direction: number) {
  const content = page.locator('#schematic-editor-content');
  await content.hover();
  await page.mouse.wheel(0, direction * 5000);
}

for (const theme of ['light', 'dark'] as const) {
  test(`preview actions survive editor scrolling ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page);
    const before = await saved(page);
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
      const rebuild = page.getByRole('button', { name: 'Rebuild wiring', exact: true });
      if (!(await rebuild.isVisible())) {
        await page.getByText('Wiring', { exact: true }).click();
      }
      await rebuild.click();
      for (const direction of [1, -1]) {
        const scanning = page.getByRole('combobox', { name: 'Scanning type', exact: true });
        await scanning.hover();
        await page.mouse.wheel(0, direction * 5000);
        await scrollEditors(page, direction);
        await expectPainted(page.getByText('Wiring preview', { exact: true }));
        await expectPainted(page.getByRole('button', { name: 'Apply wiring', exact: true }));
        await expectPainted(page.getByRole('button', { name: 'Cancel wiring', exact: true }));
      }
      await page.screenshot({ path: test.info().outputPath(`preview-${width}.png`) });
      await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
      expect(await saved(page)).toEqual(before);
    }
  });
}
