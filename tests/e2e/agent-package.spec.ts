import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { strFromU8, unzipSync } from 'fflate';
import { downloadZip, history, importText, openProject, saved } from './helpers';

async function downloadPackage(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download agent package', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('zmk-customizer-agent-v1.zip');
  const bytes = await readFile(await download.path());
  return {
    bytes,
    files: Object.fromEntries(
      Object.entries(unzipSync(bytes)).map(([path, content]) => [path, strFromU8(content)]),
    ),
  };
}

// Native dialog focus and Escape are engine-sensitive, so this case also runs in Firefox/WebKit.
test('agent package keyboard download, Escape and safe example import/export @cross-browser', async ({
  page,
  context,
  browserName,
}) => {
  await openProject(page);
  const before = await saved(page);
  const opener = page.getByRole('button', { name: 'Create with agent', exact: true });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Create with agent' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  // macOS WebKit follows Safari's system keyboard-navigation setting.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  const button = dialog.getByRole('button', { name: 'Download agent package', exact: true });
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await context.setOffline(true);
  const first = await downloadPackage(page);
  const second = await downloadPackage(page);
  expect(first.bytes.equals(second.bytes)).toBe(true);
  expect(Object.keys(first.files)).toHaveLength(8);
  expect(first.files['PROMPT.md']).toContain('explicit approval');
  expect(JSON.stringify(first.files)).not.toContain(before.name);
  await expect(page.getByRole('status')).toContainText('Agent package download started');
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(dialog).not.toBeVisible();
  await context.setOffline(false);
  await checkExamples(page, first.files);
});

async function checkExamples(page: Page, files: Readonly<Record<string, string>>) {
  for (const [id, count] of [
    ['macropad-9', 9],
    ['corne-42', 42],
  ] as const) {
    const example = files[`examples/${id}.json`];
    if (example === undefined) {
      throw new Error(`Missing example ${id}`);
    }
    await importText(page, example);
    await expect.poll(async () => (await saved(page)).keys.length).toBe(count);
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
    const firmware = await downloadZip(page);
    expect(Object.keys(firmware).some((path) => path.endsWith('.keymap'))).toBe(true);
    expect(firmware['build.yaml']).toContain('nice_nano_v2');
    const name = page.getByRole('textbox', { name: 'Name', exact: true });
    const originalName = await name.inputValue();
    await name.fill('Agent reviewed');
    await name.press('Enter');
    await history(page, 'Undo').click();
    await expect(name).toHaveValue(originalName);
    await history(page, 'Redo').click();
    await expect(name).toHaveValue('Agent reviewed');
    await page.reload();
    await expect(name).toHaveValue('Agent reviewed');
  }
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1024, 640]) {
    test(`agent instructions reflow and remain keyboard reachable at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 600 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await openProject(page);
      await page.getByRole('button', { name: 'Create with agent', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Create with agent' });
      await expect(dialog).toBeVisible();
      const dimensions = await dialog.evaluate((element) => ({
        width: element.clientWidth,
        contentWidth: element.scrollWidth,
        viewportWidth: innerWidth,
      }));
      expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
      expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth);
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Download agent package' })).toBeFocused();
      const screenshot = testInfo.outputPath(`agent-${theme}-${width}.png`);
      await page.screenshot({ path: screenshot });
      await testInfo.attach('agent dialog', { path: screenshot, contentType: 'image/png' });
    });
  }
}
