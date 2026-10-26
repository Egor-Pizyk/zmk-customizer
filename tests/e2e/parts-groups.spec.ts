import { expect, test } from './test';
import { history, openProject, saved } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Parts folds Keys and Encoders independently in ${colorScheme} @cross-browser`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await openProject(page);
    const before = await saved(page);
    const parts = page.getByRole('region', { name: 'Parts', exact: true });
    const keys = parts.getByRole('heading', { name: 'Keys', level: 3 }).locator('..');
    const encoders = parts.getByRole('heading', { name: 'Encoders', level: 3 }).locator('..');
    await keys.focus();
    await page.keyboard.press('Enter');
    await expect(parts.getByRole('button', { name: 'Add key', exact: true })).toBeHidden();
    await encoders.focus();
    await page.keyboard.press('Space');
    const add = parts.getByRole('button', { name: 'Add encoder', exact: true });
    await expect(add).toBeVisible();
    expect(await saved(page)).toEqual(before);
    await add.click();
    const x = parts.getByRole('spinbutton', { name: 'Encoder 0 X (u)', exact: true });
    await x.fill('7');
    await x.press('Enter');
    const edited = await saved(page);
    expect(edited.encoders[0]?.xU).toBe(7);
    await expect(parts.getByRole('button', { name: 'Add key', exact: true })).toBeHidden();
    await keys.press('Enter');
    await expect(add).toBeVisible();
    await expect(parts.getByRole('button', { name: 'Add key', exact: true })).toBeVisible();
    await encoders.press('Enter');
    await expect(add).toBeHidden();
    expect(await saved(page)).toEqual(edited);
    await page.getByText('Parts', { exact: true }).click();
    await page.getByText('Parts', { exact: true }).click();
    await expect(add).toBeHidden();
    await encoders.press('Enter');
    await keys.press('Enter');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await x.scrollIntoViewIfNeeded();
      await x.focus();
      await expect(x).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath(`parts-${colorScheme}-${width}.png`) });
    }
    await parts.getByRole('button', { name: 'Delete encoder 0', exact: true }).click();
    await expect(add).toBeFocused();
    await expect.poll(async () => (await saved(page)).encoders).toEqual([]);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(edited);
    await page.reload();
    expect(await saved(page)).toEqual(edited);
    await page.getByText('Parts', { exact: true }).click();
    await page.getByRole('button', { name: /^Export/u }).click();
    await page
      .getByRole('button', { name: /Schematic: Encoder 0: connect A through a wire/u })
      .click();
    await expect(
      page.getByRole('checkbox', { name: 'Encoder 0 schematic wiring', exact: true }),
    ).toBeFocused();
    await expect(
      page
        .getByRole('region', { name: 'Parts', exact: true })
        .getByRole('heading', { name: 'Encoders', level: 3 }),
    ).toBeVisible();
  });
}
