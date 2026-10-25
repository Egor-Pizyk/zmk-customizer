import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { openProject, saved, history } from './helpers';

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
      await page.getByText('Wiring', { exact: true }).click();
      await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
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
      await page.getByText('Parts', { exact: true }).click();
      await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).check();
      await page.getByText('Precise properties', { exact: true }).click();
      const angle = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
      const offset = page.getByRole('spinbutton', { name: 'Move X (u)', exact: true });
      await offset.fill('1');
      await offset.fill('0');
      await offset.press('Enter');
      await scrollEditors(page, 1);
      await expectPainted(page.getByText('Layout preview', { exact: true }));
      await expect(page.getByRole('button', { name: 'Apply layout', exact: true })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expectPainted(page.getByText(/^No layout changes:/u));
      const cancel = page.getByRole('button', { name: 'Cancel preview', exact: true });
      await expectPainted(cancel);
      await cancel.focus();
      await cancel.press('Enter');
      expect(await saved(page)).toEqual(before);
      await angle.fill('30');
      await angle.press('Enter');
      await scrollEditors(page, 1);
      await expectPainted(page.getByText('Layout preview', { exact: true }));
      await expectPainted(page.getByRole('button', { name: 'Apply layout', exact: true }));
      await expectPainted(page.getByRole('button', { name: 'Cancel preview', exact: true }));
      await page.screenshot({ path: test.info().outputPath(`layout-preview-${width}.png`) });
      await page.getByRole('button', { name: 'Apply layout', exact: true }).click();
      const applied = await saved(page);
      expect(applied).not.toEqual(before);
      await history(page, 'Undo').click();
      expect(await saved(page)).toEqual(before);
      await history(page, 'Redo').click();
      expect(await saved(page)).toEqual(applied);
      await history(page, 'Undo').click();
    }
  });
}
