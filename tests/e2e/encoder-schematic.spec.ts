import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import {
  center,
  drag,
  beginDrag,
  history,
  importText,
  saved,
  downloadJson,
  downloadZip,
  wiredFixture,
  workspace,
} from './helpers';

const empty = {
  ...wiredFixture,
  name: 'Encoder push',
  shieldName: 'encoder_push',
  keys: [],
  wires: [],
  layers: [{ id: 'l0', name: 'Base', bindings: {} }],
};
function encoder(page: Page) {
  return page.locator('[role="graphics-symbol"][aria-label^="Encoder 0,"]');
}
async function showEncoderEditor(page: Page) {
  const field = page.getByRole('spinbutton', {
    name: 'Encoder 0 Rotation (°)',
    exact: true,
  });
  if (!(await field.isVisible())) {
    await page.getByText('Encoders', { exact: true }).click();
  }
  return field;
}
async function connectRotary(page: Page) {
  await page.getByText('Parts', { exact: true }).click();
  for (const [pin, boardPin] of [
    ['A', '20'],
    ['B', '21'],
    ['COM', 'ground'],
  ] as const) {
    await page
      .getByRole('combobox', { name: 'From', exact: true })
      .selectOption(`encoder:e1:${pin}`);
    await page
      .getByRole('combobox', { name: 'To', exact: true })
      .selectOption(boardPin === 'ground' ? 'ground' : 'free');
    const index = (await saved(page)).wires.length;
    await page.getByRole('button', { name: 'Add wire', exact: true }).click();
    await expect.poll(async () => (await saved(page)).wires.length).toBe(index + 1);
    if (boardPin !== 'ground') {
      await page
        .getByRole('combobox', {
          name: `Wire ${index} end board pin`,
          exact: true,
        })
        .selectOption(boardPin);
    }
  }
}
async function assignPush(page: Page) {
  await workspace(page, 'Bindings');
  await page.getByRole('heading', { name: 'Keys', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Choose action for Encoder 0 push',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Key press', exact: true }).click();
  await page.getByRole('button', { name: /^key:/u }).click();
  const search = page.getByRole('searchbox', {
    name: 'Search by name, code or symbol',
    exact: true,
  });
  await search.fill('SPACE');
  await search.press('Enter');
}

test('encoder tool moves and rotates its push key with cancellable preview @cross-browser', async ({
  page,
}, info) => {
  await openEmpty(page);
  await page.getByRole('radio', { name: 'Encoder', exact: true }).press('Space');
  const surface = await page.locator('[data-canvas-workspace="schematic"]').boundingBox();
  if (surface === null) {
    throw new Error('Missing canvas');
  }
  await page.mouse.click(surface.x + 350, surface.y + 250);
  await expect(encoder(page)).toBeVisible();
  const placed = await saved(page);
  expect(placed.encoders[0]).toMatchObject({
    id: 'e1',
    wiringMode: 'schematic',
    pushKeyId: 'k1',
  });
  expect(placed.keys).toHaveLength(1);
  await page.getByRole('radio', { name: 'Select', exact: true }).press('Space');
  const body = encoder(page).locator('circle').first();
  let point = await center(body);
  await beginDrag(page, point, { x: point.x + 96, y: point.y + 48 });
  expect(await saved(page)).toEqual(placed);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await saved(page)).toEqual(placed);
  await expect
    .poll(async () => {
      const restored = await center(body);
      return Math.hypot(restored.x - point.x, restored.y - point.y);
    })
    .toBeLessThan(0.75);
  point = await center(body);
  await beginDrag(page, point, { x: point.x + 96, y: point.y + 48 });
  await page.mouse.up();
  await expect.poll(async () => (await saved(page)).keys[0]?.xU).not.toBe(placed.keys[0]?.xU);
  const moved = await saved(page);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(placed);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(moved);
  const origin = await center(body);
  const handles = page.locator('[data-encoder-rotate="e1"]');
  await expect(handles).toHaveCount(1);
  await expect(handles.first()).toBeVisible();
  const handle = handles.first();
  const start = await center(handle);
  await drag(page, start, {
    x: origin.x - (start.y - origin.y),
    y: origin.y + (start.x - origin.x),
  });
  await expect.poll(async () => (await saved(page)).keys[0]?.rotationDeg ?? 0).not.toBe(0);
  const rotated = await saved(page);
  expect(Math.abs((rotated.keys[0]?.rotationDeg ?? 0) - 90)).toBeLessThan(2);
  const after = await center(body);
  expect(Math.hypot(after.x - origin.x, after.y - origin.y)).toBeLessThan(0.75);
  const rotation = await showEncoderEditor(page);
  await rotation.fill('90');
  await rotation.press('Enter');
  expect((await saved(page)).keys[0]?.rotationDeg).toBe(90);
  expect(JSON.parse(await downloadJson(page))).toEqual(await saved(page));
  await page.screenshot({ path: info.outputPath('encoder-push.png') });
  const final = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(final);
});

test('encoder contacts and ordinary push key export together; deletion is atomic', async ({
  page,
}, info) => {
  await openEmpty(page);
  await page.getByText('Encoders', { exact: true }).click();
  await page.getByRole('button', { name: 'Add encoder', exact: true }).click();
  // Space above the symbolic contacts keeps the ordinary push-key routes separate.
  for (const [name, value] of [
    ['X (u)', '5'],
    ['Y (u)', '5'],
  ] as const) {
    const field = page.getByRole('spinbutton', {
      name: `Encoder 0 ${name}`,
      exact: true,
    });
    await field.fill(value);
    await field.press('Enter');
  }
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  await connectRotary(page);
  await assignPush(page);
  await expect(page.locator('[data-encoder-keycap="e1"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('encoder-bindings.png') });
  const project = await saved(page);
  expect(project.layers[0]?.bindings['k1']).toEqual({
    kind: 'kp',
    key: { keycode: 'SPACE', modifiers: [] },
  });
  const files = await downloadZip(page);
  expect(files['boards/shields/encoder_push/encoder_push.overlay']).toContain(
    'a-gpios = <&pro_micro 20',
  );
  expect(files['boards/shields/encoder_push/encoder_push.overlay']).toContain(
    'b-gpios = <&pro_micro 21',
  );
  expect(files['config/encoder_push.keymap']).toContain('&kp SPACE');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .zip', exact: true }).click();
  const bytes = await readFile(await (await download).path());
  const directory = info.outputPath('actual-export');
  await mkdir(directory, { recursive: true });
  for (const [name, content] of Object.entries(unzipSync(bytes))) {
    await mkdir(path.dirname(`${directory}/${name}`), { recursive: true });
    await writeFile(`${directory}/${name}`, content);
  }
  await workspace(page, 'Schematic');
  await showEncoderEditor(page);
  await page.getByRole('button', { name: 'Delete encoder 0', exact: true }).click();
  expect((await saved(page)).encoders).toHaveLength(0);
  expect((await saved(page)).keys).toHaveLength(0);
  expect((await saved(page)).wires).toHaveLength(0);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(project);
  await page.reload();
  expect(await saved(page)).toEqual(project);
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Settings', exact: true })
      .getByRole('radio', { name: theme, exact: true })
      .press('Space');
    await page.keyboard.press('Escape');
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
      const field = await showEncoderEditor(page);
      await field.scrollIntoViewIfNeeded();
      await expect(field).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`encoder-${theme}-${width}.png`),
      });
    }
  }
});

async function openEmpty(page: Page) {
  await page.goto('/');
  await importText(page, JSON.stringify(empty));
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(empty.name);
}
