import { expect, test } from '@playwright/test';

test('onboarding keyboard focus, escape and responsive spotlight @cross-browser', async ({
  page,
}, info) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Start empty learning project', exact: true })
    .press('Enter');
  const heading = page.getByRole('heading', { name: 'Name your macropad' });
  await expect(heading).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('region', { name: 'Step instructions' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Skip tour', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Exit tour', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('My macropad');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Place nine keys' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Add key', exact: true })).toBeHidden();
  await page.getByRole('heading', { name: 'Keys', level: 3 }).locator('..').press('Enter');
  await expect(page.getByRole('button', { name: 'Add key', exact: true })).toBeVisible();
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    for (const width of [1280, 1024, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole('button', { name: 'Exit tour', exact: true })).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Add key', exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath(`spotlight-${colorScheme}-${width}.png`) });
    }
  }
  await page.getByRole('button', { name: 'Add key', exact: true }).press('Enter');
  const x = page.getByRole('spinbutton', { name: 'Key 0 X (u)', exact: true });
  await x.press('ControlOrMeta+A');
  await x.press('2');
  await x.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Leave the tour?' })).not.toBeVisible();
  await x.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Leave the tour?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Place nine keys' })).toBeVisible();
  await page.getByRole('button', { name: 'Exit tour', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Save learning session and exit' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Take the tour again' })).toBeFocused();
});
