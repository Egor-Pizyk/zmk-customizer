import { expect, test } from './test';
import type { Page } from '@playwright/test';
import {
  downloadJson,
  downloadZip,
  expectGeometry,
  fixture,
  history,
  key,
  openProject,
  saved,
  wiredFixture,
  workspace,
} from './helpers';

async function chooseSize(page: Page, label: string) {
  await page
    .getByRole('dialog', { name: 'Keycap size', exact: true })
    .getByRole('button', { name: label, exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Keycap size', exact: true })).not.toBeVisible();
}

// Native context invocation, SVG focus and modal focus return are engine-sensitive.
test('standard size from canvas keeps rotated switch center, history and export @cross-browser', async ({
  page,
}) => {
  const first = wiredFixture.keys[0];
  if (first === undefined) {
    throw new Error('Missing fixture key');
  }
  const project = {
    ...wiredFixture,
    keys: [{ ...first, rotationDeg: 30, rotationOriginXU: 5.5, rotationOriginYU: 5.5 }],
  };
  await openProject(page, project);
  await workspace(page, 'Bindings');
  await key(page).click({ button: 'right' });
  const dialog = page.getByRole('dialog', { name: 'Keycap size', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Current: 1 × 1 u', { exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(project);
  await chooseSize(page, '2.25 × 1 u');
  await expect(key(page)).toBeFocused();
  const expected = {
    ...first,
    xU: 4.375,
    widthU: 2.25,
    heightU: 1,
    rotationDeg: 30,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  };
  await expectGeometry(page, expected);
  const after = await saved(page);
  expect(after.keys).toEqual([expected]);
  expect(after.layers).toEqual(project.layers);
  expect(after.wires).toEqual(project.wires);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(project);
  await key(page).focus();
  await page.keyboard.press('Shift+F10');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(key(page)).toBeFocused();
  await expect(history(page, 'Redo')).not.toHaveAttribute('aria-disabled', 'true');
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(after);
  expect(JSON.parse(await downloadJson(page))).toEqual(after);
  await page.reload();
  await expectGeometry(page, expected);
  expect(await saved(page)).toEqual(after);
  const zip = await downloadZip(page);
  const overlay = Object.entries(zip).find(([path]) => path.endsWith('.overlay'))?.[1];
  expect(overlay).toContain('<&key_physical_attrs 225 100 438 500 3000 550 550>');
});

test('table chooser preserves custom data, applies group atomically and leaves redo on current size', async ({
  page,
}) => {
  const project = {
    ...fixture,
    keys: fixture.keys.map((entry, index) =>
      index === 0 ? { ...entry, widthU: 1.37, heightU: 1.5 } : entry,
    ),
  };
  await openProject(page, project);
  await workspace(page, 'Bindings');
  await page.getByText('Keys', { exact: true }).click();
  const opener = page.getByRole('button', { name: 'Keycap size for key 0', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Keycap size', exact: true });
  await expect(dialog.getByText('Custom: 1.37 × 1.5 u', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(opener).toBeFocused();
  expect(await saved(page)).toEqual(project);
  await page.getByRole('checkbox', { name: 'Select key 1', exact: true }).check();
  await opener.click();
  await expect(dialog.getByText('2 keys selected', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Mixed sizes', { exact: true })).toBeVisible();
  await chooseSize(page, '2 × 1 u');
  const after = await saved(page);
  expect(after.keys.map((entry) => [entry.widthU, entry.heightU])).toEqual([
    [2, 1],
    [2, 1],
  ]);
  expect(after.layers).toEqual(project.layers);
  expect(after.wires).toEqual(project.wires);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(project);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(after);
  // Make an unrelated undoable edit, undo it, then selecting the current size must retain Redo.
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Temporary');
  await name.press('Enter');
  await history(page, 'Undo').click();
  await opener.click();
  await chooseSize(page, '2 × 1 u — Current');
  expect(await saved(page)).toEqual(after);
  await expect(history(page, 'Redo')).not.toHaveAttribute('aria-disabled', 'true');
});

test('larger sizes expose repairable overlap and block export', async ({ page }) => {
  const first = fixture.keys[0];
  const second = fixture.keys[1];
  if (first === undefined || second === undefined) {
    throw new Error('Missing keys');
  }
  await openProject(page, { ...fixture, keys: [first, { ...second, xU: 6, yU: 5 }] });
  await workspace(page, 'Bindings');
  await key(page).click({ button: 'right' });
  await chooseSize(page, '2 × 1 u');
  await expect(page.getByRole('status')).toContainText('Keycap size changed');
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.getByRole('button', { name: /overlap/iu }).first()).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1024, 640]) {
    test(`size chooser focus/reflow at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 600 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await openProject(page, wiredFixture);
      await workspace(page, 'Bindings');
      await key(page).focus();
      await page.keyboard.press('Shift+F10');
      const dialog = page.getByRole('dialog', { name: 'Keycap size', exact: true });
      await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(
        dialog.getByRole('button', { name: '1 × 1 u — Current', exact: true }),
      ).toBeFocused();
      await expect(
        dialog.getByRole('button', { name: '1 × 1 u — Current', exact: true }),
      ).toHaveCSS('outline-style', 'solid');
      const dimensions = await dialog.evaluate((element) => ({
        width: element.clientWidth,
        content: element.scrollWidth,
        viewport: innerWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.width);
      expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
      const screenshot = testInfo.outputPath(`keycap-${theme}-${width}.png`);
      await page.screenshot({ path: screenshot });
      await testInfo.attach('size chooser', { path: screenshot, contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await expect(key(page)).toBeFocused();
      expect(await saved(page)).toEqual(wiredFixture);
    });
  }
}
