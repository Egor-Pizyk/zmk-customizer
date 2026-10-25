import { expect, test } from './test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { history, openProject, saved, workspace } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`Problems emphasis follows live count ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page, UNIBODY_PRESET);
    const toggle = page.getByRole('button', { name: /^Problems \(/u });
    const label = toggle.locator('span').first();
    await expect(toggle).toHaveText('Problems (0)');
    await expect(label).toHaveCSS(
      'color',
      theme === 'light' ? 'rgb(27, 30, 36)' : 'rgb(230, 232, 236)',
    );
    await workspace(page, 'Firmware');
    const press = page.getByRole('spinbutton', { name: 'Press debounce (ms)' });
    await press.fill('-2');
    await press.press('Enter');
    await expect(toggle).toHaveText('Problems (1)');
    // The visible label uses the established semantic danger color in each theme.
    await expect(label).toHaveCSS(
      'color',
      theme === 'light' ? 'rgb(198, 40, 40)' : 'rgb(255, 123, 123)',
    );
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await toggle.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(toggle).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('region', { name: 'Problems', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close problems', exact: true }).press('Enter');
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await page.screenshot({ path: test.info().outputPath(`problems-${width}.png`) });
    }
    await press.fill('0');
    await press.press('Enter');
    await expect(toggle).toHaveText('Problems (0)');
    await expect(label).toHaveCSS(
      'color',
      theme === 'light' ? 'rgb(27, 30, 36)' : 'rgb(230, 232, 236)',
    );
    await history(page, 'Undo').click();
    await expect(toggle).toHaveText('Problems (1)');
    await expect(label).toHaveCSS(
      'color',
      theme === 'light' ? 'rgb(198, 40, 40)' : 'rgb(255, 123, 123)',
    );
    expect((await saved(page)).firmware).toEqual({ CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: -2 });
    await history(page, 'Redo').click();
    await expect(toggle).toHaveText('Problems (0)');
    await page.setViewportSize({ width: 1024, height: 1000 });
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('problems-zero.png') });
  });
}
