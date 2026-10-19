import { expect, test } from '@playwright/test';
import {
  downloadJson,
  downloadZip,
  expectGeometry,
  history,
  importText,
  key,
  openProject,
  saved,
  workspace,
} from './helpers';

test('preset preview is unsaved, keyboard creates split empty layout and preserves geometry @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  const newButton = page.getByRole('banner').getByRole('button', { name: 'New', exact: true });
  await newButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Start a new project?' });
  const choice = page.getByRole('combobox', { name: 'Keyboard preset', exact: true });
  await expect(choice.locator('option')).toHaveCount(11);
  await choice.selectOption('corne-42');
  await expect(dialog).toContainText('42 keys · Split, left and right halves');
  const preview = page.getByLabel('Corne 6-column layout preview');
  await expect(preview.locator('rect')).toHaveCount(42);
  await expect(preview.locator('rect').nth(38)).toHaveAttribute(
    'transform',
    'rotate(24 5.48 4.58)',
  );
  await page.getByText('Key geometry and QWERTY assignments', { exact: true }).click();
  await expect(page.getByRole('list', { name: 'Preset key geometry' })).toContainText(
    'Key 39: ENTER',
  );
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(newButton).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Enter');
  await choice.selectOption('corne-42');
  const empty = page.getByRole('radio', { name: 'Empty keymap' });
  await empty.focus();
  await page.keyboard.press('Space');
  const create = page.getByRole('button', { name: 'Create project from preset' });
  await create.focus();
  await page.keyboard.press('Enter');
  await expect(newButton).toBeFocused();
  await expect.poll(async () => (await saved(page)).keys.length).toBe(42);
  const created = await saved(page);
  expect(created.keys.filter((entry) => entry.half === 'left')).toHaveLength(21);
  expect(created.keys.filter((entry) => entry.half === 'right')).toHaveLength(21);
  expect(created.keys[38]).toMatchObject({
    id: 'k38',
    xU: 5.48,
    yU: 3.08,
    heightU: 1.5,
    rotationDeg: 24,
    rotationOriginXU: 5.48,
    rotationOriginYU: 4.58,
    half: 'left',
  });
  expect(created.layers[0]?.bindings).toEqual({});
  expect(created.wiring).toEqual({
    kind: 'matrix',
    topology: 'split',
    diodeDirection: 'col2row',
    terminals: [],
  });
  await expect(history(page, 'Undo')).toBeDisabled();
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
  const thumb = created.keys[38];
  if (thumb === undefined) {
    throw new Error('Missing Corne thumb');
  }
  await expectGeometry(page, thumb, 38);
  expect(JSON.parse(await downloadJson(page))).toEqual(created);
  await importText(page, JSON.stringify(created));
  await page.reload();
  await expect.poll(() => saved(page)).toEqual(created);
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
});

test('QWERTY macropad edits undo and redo, save current work from New and retain complete starter export', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save to file', exact: true }).click();
  const backup = await pending;
  const path = await backup.path();
  const { readFile } = await import('node:fs/promises');
  expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(before);
  await page.getByRole('button', { name: 'Create project from preset' }).click();
  const created = await saved(page);
  expect(created.keys).toHaveLength(9);
  expect(created.keys[8]).toEqual({ id: 'k8', xU: 2, yU: 2 });
  expect(created.layers[0]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'N1', modifiers: [] },
  });
  expect(created.layers[0]?.bindings['k8']).toEqual({
    kind: 'kp',
    key: { keycode: 'N9', modifiers: [] },
  });
  await expect(key(page, 8)).toBeAttached();
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Edited macropad');
  await name.press('Enter');
  const edited = await saved(page);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(created);
  await history(page, 'Redo').click();
  await expect.poll(() => saved(page)).toEqual(edited);
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Keyboard preset', exact: true })
    .selectOption('ansi-104');
  await expect(page.getByLabel('ANSI full-size layout preview').locator('rect')).toHaveCount(104);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await saved(page)).toEqual(edited);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(created);
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Start six-key unibody preset', exact: true }).click();
  await workspace(page, 'Export');
  const files = await downloadZip(page);
  expect(files['config/unibody_six.keymap']).toContain('&kp A');
});

test('Lily58 and Sofle preserve halves in both modes; New dialog reflows at narrow desktop @cross-browser', async ({
  page,
}, testInfo) => {
  await openProject(page);
  await page.setViewportSize({ width: 720, height: 700 });
  for (const presetId of ['lily58-58', 'sofle-58']) {
    let geometries;
    for (const mode of ['QWERTY', 'Empty keymap']) {
      await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
      await page
        .getByRole('combobox', { name: 'Keyboard preset', exact: true })
        .selectOption(presetId);
      await page.getByRole('radio', { name: mode, exact: true }).focus();
      await page.keyboard.press('Space');
      const dialog = page.getByRole('dialog', { name: 'Start a new project?' });
      const bounds = await dialog.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(720);
      expect(bounds?.height).toBeLessThanOrEqual(700);
      if (presetId === 'sofle-58' && mode === 'QWERTY') {
        await page.screenshot({ path: testInfo.outputPath('sofle-preview.png') });
      }
      await page.getByRole('button', { name: 'Create project from preset' }).click();
      const project = await saved(page);
      expect(project.keys).toHaveLength(58);
      expect(project.keys.filter((entry) => entry.half === 'left')).toHaveLength(29);
      expect(project.keys.filter((entry) => entry.half === 'right')).toHaveLength(29);
      if (geometries === undefined) {
        geometries = project.keys;
      } else {
        expect(project.keys).toEqual(geometries);
      }
      expect(Object.keys(project.layers[0]?.bindings ?? {})).toHaveLength(
        mode === 'QWERTY' ? 58 : 0,
      );
    }
  }
});
