import { test, expect } from './test';
import { openProject, saved } from './helpers';

test('wiring documentation has distinct destinations and names the shared diode source', async ({
  page,
}, info) => {
  await openProject(page);
  const original = await saved(page);
  await page.getByText('Wiring', { exact: true }).click();
  const links = page.getByRole('link', {
    name: /^Docs for (?:Scanning type|Keyboard topology|Diode direction)/u,
  });
  await expect(links).toHaveCount(2);
  const scanning = page.getByRole('link', {
    name: 'Docs for Scanning type and diode direction (opens in a new tab)',
    exact: true,
  });
  const topology = page.getByRole('link', {
    name: 'Docs for Keyboard topology (opens in a new tab)',
    exact: true,
  });
  await expect(scanning).toHaveAttribute(
    'href',
    'https://v0-3-branch.zmk.dev/docs/config/kscan#matrix-driver',
  );
  await expect(topology).toHaveAttribute('href', 'https://v0-3-branch.zmk.dev/docs/config/kscan');
  await expect(scanning).toHaveAttribute('title', 'ZMK docs: Scanning type and diode direction');
  await expect(scanning).toHaveAttribute('target', '_blank');
  await expect(scanning).toHaveAttribute('rel', 'noreferrer');
  await scanning.focus();
  await page.keyboard.press('Tab');
  await expect(topology).toBeFocused();
  await page
    .getByRole('combobox', { name: 'Diode direction', exact: true })
    .selectOption('row2col');
  await expect(links).toHaveCount(2);
  await expect(scanning).toHaveAttribute(
    'href',
    'https://v0-3-branch.zmk.dev/docs/config/kscan#matrix-driver',
  );
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Settings', exact: true })
      .getByRole('radio', { name: theme, exact: true })
      .press('Space');
    await page.keyboard.press('Escape');
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await scanning.scrollIntoViewIfNeeded();
      await expect(scanning).toBeVisible();
      await expect(topology).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`wiring-docs-${width}-${theme.toLowerCase()}.png`),
      });
    }
  }
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption('direct');
  await expect(
    page.getByRole('link', { name: 'Docs for Scanning type (opens in a new tab)', exact: true }),
  ).toHaveAttribute('href', 'https://v0-3-branch.zmk.dev/docs/config/kscan#direct-gpio-driver');
  await expect(scanning).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Keyboard topology', exact: true })
    .selectOption('split');
  await expect(topology).toHaveAttribute('href', 'https://v0-3-branch.zmk.dev/docs/config/split');
  await expect(links).toHaveCount(2);
  expect(await saved(page)).toEqual(original);
});
