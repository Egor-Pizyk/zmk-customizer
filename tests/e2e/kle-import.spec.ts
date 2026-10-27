import { test, expect } from './test';
import {
  downloadJson,
  expectGeometry,
  history,
  key,
  openProject,
  saved,
  workspace,
} from './helpers';

const layout = [[{ r: 15, rx: 2, ry: 1, w: 1.5 }, 'A', { x: 1 }, 'B']];
const first = {
  id: 'k0',
  xU: 2,
  yU: 1,
  widthU: 1.5,
  heightU: 1,
  rotationDeg: 15,
  rotationOriginXU: 2,
  rotationOriginYU: 1,
};

test('KLE review, keyboard apply, saved/downloaded geometry and one-step history @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  for (const name of [
    'Duplicate selected keys',
    'Delete selected keys',
    'Renumber by position',
    'Edit selected layout',
  ]) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('Precise properties', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Layout', exact: true })).toHaveCount(0);
  await expect(page.getByText('Import KLE layout', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  const summary = page.getByText('Import KLE layout', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  const input = page.getByLabel('KLE JSON file');
  await input.setInputFiles({
    name: 'layout.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(layout)),
  });
  await expect(page.getByText('2 physical keys ready to import.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'KLE conversion warnings' })).toContainText(
    'legends',
  );
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'Cancel KLE import' }).click();
  await expect(input).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await input.setInputFiles({
    name: 'layout.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(layout)),
  });
  const apply = page.getByRole('button', { name: 'Replace project with KLE layout' });
  await apply.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Start a new project?' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'New', exact: true })).toBeFocused();
  await expect
    .poll(async () => (await saved(page)).keys)
    .toEqual([first, { ...first, id: 'k1', xU: 4.5, widthU: 1 }]);
  const imported = await saved(page);
  await expect(key(page, 1)).toBeVisible();
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
  await expectGeometry(page, first);
  expect(JSON.parse(await downloadJson(page))).toEqual(imported);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  await expect.poll(() => saved(page)).toEqual(imported);
  await page.reload();
  await expect.poll(() => saved(page)).toEqual(imported);
  await expect(key(page, 1)).toBeVisible();
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
});

test('KLE malformed retry and closing New preserve current project', async ({ page }) => {
  await openProject(page);
  const before = await saved(page);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByText('Import KLE layout', { exact: true }).click();
  const input = page.getByLabel('KLE JSON file');
  await input.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json'),
  });
  await expect(page.getByRole('alert')).toContainText('JSON');
  expect(await saved(page)).toEqual(before);
  await input.setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('[ ["A"] ]'),
  });
  await expect(page.getByText('1 physical key ready to import.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'New', exact: true })).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByText('Import KLE layout', { exact: true }).click();
  await expect(page.getByText('1 physical key ready to import.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Replace project with KLE layout' })).toHaveCount(
    0,
  );
  expect(await saved(page)).toEqual(before);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`KLE review in New reflows in ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 640, height: 500 });
    await openProject(page);
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByText('Import KLE layout', { exact: true }).click();
    await page.getByLabel('KLE JSON file').setInputFiles({
      name: 'layout.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(layout)),
    });
    const dialog = page.getByRole('dialog', { name: 'Start a new project?' });
    const apply = dialog.getByRole('button', { name: 'Replace project with KLE layout' });
    await apply.focus();
    await expect(apply).toBeInViewport();
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`kle-new-${colorScheme}.png`) });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'New', exact: true })).toBeFocused();
  });
}
