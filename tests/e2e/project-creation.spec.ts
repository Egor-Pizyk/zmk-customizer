import { expect, test } from '@playwright/test';
import { history, openProject, saved } from './helpers';

test('New has three equal actions, red Cancel and safe keyboard empty creation @cross-browser', async ({
  page,
}, testInfo) => {
  await openProject(page);
  const before = await saved(page);
  const opener = page.getByRole('banner').getByRole('button', { name: 'New', exact: true });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Start a new project?' });
  const actions = dialog.locator('[aria-label="New project actions"]').getByRole('button');
  await expect(actions).toHaveText(['Create project from preset', 'Start empty project', 'Cancel']);
  await expect(dialog.getByRole('button', { name: 'Save to file', exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /six-key/u })).toHaveCount(0);
  for (const width of [1280, 640]) {
    await page.setViewportSize({ width, height: 720 });
    const sizes = await actions.evaluateAll((buttons) =>
      buttons.map((button) => ({
        width: button.getBoundingClientRect().width,
        height: button.getBoundingClientRect().height,
      })),
    );
    expect(sizes[1]).toEqual(sizes[0]);
    expect(sizes[2]).toEqual(sizes[0]);
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
    await dialog.getByRole('button', { name: 'Create project from preset', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Start empty project', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await expect(cancel).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`new-${width}.png`) });
  }
  const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
  const colors = await cancel.evaluate((button) => ({
    actual: getComputedStyle(button).backgroundColor,
    token: getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim(),
  }));
  expect(colors.actual).not.toBe('rgba(0, 0, 0, 0)');
  expect(colors.token).not.toBe('');
  await page.keyboard.press('Enter');
  await expect(opener).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Enter');
  const empty = dialog.getByRole('button', { name: 'Start empty project', exact: true });
  await empty.focus();
  await page.keyboard.press('Enter');
  await expect(opener).toBeFocused();
  await expect.poll(async () => (await saved(page)).keys).toEqual([]);
  await expect(history(page, 'Undo')).toBeDisabled();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`New action colors and reflow in ${colorScheme} with reduced motion @cross-browser`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 640, height: 500 });
    await openProject(page);
    await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Start a new project?' });
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
    await cancel.focus();
    await expect(cancel).toBeInViewport({ ratio: 1 });
    const background = await cancel.evaluate((button) => getComputedStyle(button).backgroundColor);
    expect(background).toBe(colorScheme === 'light' ? 'rgb(198, 40, 40)' : 'rgb(255, 123, 123)');
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`new-${colorScheme}-reflow.png`) });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'New', exact: true }),
    ).toBeFocused();
  });
}
