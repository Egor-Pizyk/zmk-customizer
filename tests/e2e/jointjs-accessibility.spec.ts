import { expect, test } from './test';
import { openProject, saved, wiredFixture } from './helpers';

const viewports = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 720, height: 450 },
];
for (const theme of ['light', 'dark'] as const) {
  test(`native diagram names, fixed targets and reflow in ${theme}`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const project = {
      ...wiredFixture,
      wires: wiredFixture.wires.map((wire) => ({ ...wire, bends: [{ xU: 3, yU: 4 }] })),
    };
    await openProject(page, project);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      if (viewport.width <= 720) {
        const collapse = page.getByRole('button', { name: 'Collapse Tools', exact: true });
        if (await collapse.isVisible()) {
          await collapse.click();
        }
      }
      await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
      await expect(
        page.locator('.joint-paper [role="graphics-symbol"][aria-label^="Key 0"]'),
      ).toHaveCount(1);
      await expect(page.locator('.joint-paper [tabindex="0"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const surface = page.locator('[data-canvas-workspace="schematic"]');
      await surface.scrollIntoViewIfNeeded();
      await surface.focus();
      await surface.press('-');
      await surface.press('-');
      const target = page.locator('[data-wire-bend] rect[pointer-events="all"]').first();
      const dimensions = await target.boundingBox();
      expect(dimensions?.width).toBeCloseTo(24, 3);
      expect(dimensions?.height).toBeCloseTo(24, 3);
      expect(await saved(page)).toEqual(project);
      await page.screenshot({
        path: info.outputPath(`${theme}-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
  });
}
