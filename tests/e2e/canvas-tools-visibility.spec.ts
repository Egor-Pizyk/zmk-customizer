import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
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

for (const theme of ['light', 'dark'] as const) {
  test(`Tools cannot cover canvas controls ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page);
    const before = await saved(page);
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const expand = page.getByRole('button', { name: 'Expand Tools', exact: true });
      if (await expand.isVisible()) {
        await expand.click();
      }
      const move = page.getByRole('button', { name: 'Move tools window, use arrow keys' });
      await move.focus();
      for (let index = 0; index < 12; index += 1) {
        await move.press('Shift+ArrowRight');
      }
      for (let index = 0; index < 12; index += 1) {
        await move.press('Shift+ArrowUp');
      }
      for (const name of ['Snap to grid', 'Zoom in', 'Zoom out', 'Center keyboard']) {
        const button = page.getByRole('button', { name, exact: true });
        await expectPainted(button);
        await button.click();
        await button.focus();
        await button.press('Enter');
      }
      await page.screenshot({ path: test.info().outputPath(`tools-${width}.png`) });
    }
    expect(await saved(page)).toEqual(before);
  });
}
