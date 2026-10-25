import { test, expect } from './test';
import { openProject, saved } from './helpers';

test('keeps the canvas visible beside or above a bounded editor @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await expect(page.getByRole('heading', { name: 'Editors', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^(?:Collapse|Close|Open|Expand) editors$/u }),
  ).toHaveCount(0);
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 640, height: 400 },
    { width: 1280, height: 800 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    const root = await page.getByLabel('Schematic editing area', { exact: true }).boundingBox();
    const panel = await page.getByLabel('Schematic editors', { exact: true }).boundingBox();
    const canvas = await page.locator('[data-canvas-workspace="schematic"]').boundingBox();
    expect(root).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(canvas).not.toBeNull();
    if (root === null || panel === null || canvas === null) {
      throw new Error('Missing layout region');
    }
    if (size.width >= 1280) {
      expect(panel.width).toBeLessThanOrEqual(Math.min(640, root.width * 0.45) + 1);
      expect(canvas.width).toBeGreaterThanOrEqual(root.width * 0.55);
      expect(panel.x).toBeGreaterThanOrEqual(canvas.x + canvas.width);
    } else {
      expect(panel.height).toBeLessThanOrEqual(root.height * 0.45 + 1);
      expect(canvas.height).toBeGreaterThanOrEqual(root.height * 0.5);
    }
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('body *')]
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 12)
        .map((element) => ({
          tag: element.tagName,
          cls: element.className,
          right: element.getBoundingClientRect().right,
        })),
    }));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      JSON.stringify(overflow),
    ).toBe(true);
  }
  await page.getByText('Controller', { exact: true }).click();
  await expect(
    page.getByText('Controller', { exact: true }).locator('xpath=ancestor::details'),
  ).toHaveAttribute('open', '');
  await page.getByText('Parts', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Wire sections' })).toBeVisible();
});

test('keeps Settings compact and editor switches transient in both themes @cross-browser', async ({
  page,
}, info) => {
  await openProject(page);
  const original = await saved(page);
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
    await dialog.getByRole('radio', { name: theme, exact: true }).press('Space');
    const bounds = await dialog.boundingBox();
    expect(bounds?.width).toBeLessThanOrEqual(480);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
    await page.getByText('Wiring', { exact: true }).click();
    await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
    await page.getByText('Controller', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toHaveCount(0);
    expect(await page.locator('details[name="schematic-editor"][open]').count()).toBe(1);
    expect(await saved(page)).toEqual(original);
    await page.screenshot({ path: info.outputPath(`panels-${theme.toLowerCase()}.png`) });
  }
});

test('resizes editors with pointer and keyboard, cancels and retains preferred size @cross-browser', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openProject(page);
  const original = await saved(page);
  const panel = page.getByLabel('Schematic editors', { exact: true });
  const handle = page.getByRole('button', {
    name: 'Resize editors, use left and right arrow keys',
  });
  const width = async () => (await panel.boundingBox())?.width ?? 0;
  await expect.poll(width).toBe(448);
  const coordinate = await page
    .getByRole('spinbutton', { name: 'Key 0 X (u)', exact: true })
    .boundingBox();
  expect(coordinate?.width).toBeGreaterThanOrEqual(64);
  const start = await handle.boundingBox();
  if (start === null) {
    throw new Error('Missing resize handle');
  }
  await page.mouse.move(start.x + start.width / 2, start.y + 40);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 - 96, start.y + 40, { steps: 8 });
  await expect.poll(width).toBe(544);
  expect(
    await page.evaluate(() => localStorage.getItem('zmk-customizer:preferences')),
  ).not.toContain('"schematicEditorWidthPx":544');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect.poll(width).toBe(448);
  for (const [delta, expected] of [
    [-1000, 640],
    [1000, 320],
  ] as const) {
    const edge = await handle.boundingBox();
    if (edge === null) {
      throw new Error('Missing resize handle');
    }
    await page.mouse.move(edge.x + edge.width / 2, edge.y + 40);
    await page.mouse.down();
    await page.mouse.move(edge.x + edge.width / 2 + delta, edge.y + 40, { steps: 8 });
    await page.mouse.up();
    await expect.poll(width).toBe(expected);
  }
  await handle.focus();
  await page.keyboard.press('Home');
  await expect.poll(width).toBe(320);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(width).toBe(336);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(width).toBe(400);
  await page.keyboard.press('End');
  await expect.poll(width).toBe(640);
  await page.keyboard.press('ArrowRight');
  await expect.poll(width).toBe(624);
  const next = await handle.boundingBox();
  if (next === null) {
    throw new Error('Missing resize handle');
  }
  await page.mouse.move(next.x + next.width / 2, next.y + 40);
  await page.mouse.down();
  await page.mouse.move(next.x + next.width / 2 + 112, next.y + 40, { steps: 8 });
  await page.mouse.up();
  await expect.poll(width).toBe(512);
  await page.reload();
  await expect.poll(width).toBe(512);
  await page.getByRole('button', { name: /^Bindings(?:,|$)/u }).click();
  await page.getByRole('button', { name: /^Schematic(?:,|$)/u }).click();
  await expect.poll(width).toBe(512);
  await page.setViewportSize({ width: 1280, height: 800 });
  const area = await page.getByLabel('Schematic editing area', { exact: true }).boundingBox();
  const canvas = await page.locator('[data-canvas-workspace="schematic"]').boundingBox();
  if (area === null || canvas === null) {
    throw new Error('Missing editing area');
  }
  expect(await width()).toBeLessThanOrEqual(area.width * 0.45 + 1);
  expect(canvas.width).toBeGreaterThanOrEqual(area.width * 0.55 - 1);
  expect((await panel.boundingBox())?.x).toBeGreaterThanOrEqual(canvas.x + canvas.width);
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(handle).toBeHidden();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect.poll(width).toBe(512);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  expect(await saved(page)).toEqual(original);
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Settings', exact: true })
      .getByRole('radio', { name: theme, exact: true })
      .press('Space');
    await page.keyboard.press('Escape');
    await page.screenshot({
      path: info.outputPath(`resizable-editors-${theme.toLowerCase()}.png`),
    });
    for (const viewportWidth of [390, 1280]) {
      await page.setViewportSize({ width: viewportWidth, height: 844 });
      await expect(page.getByRole('heading', { name: 'Editors', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`editors-${viewportWidth}-${theme.toLowerCase()}.png`),
      });
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
  }
  await handle.dblclick();
  await expect.poll(width).toBe(448);
});

test('gives peer editor headings equal size and keeps precise properties inside Layout', async ({
  page,
}, info) => {
  await openProject(page);
  const original = await saved(page);
  const editors = page.getByLabel('Schematic editors', { exact: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'Settings', exact: true })
        .getByRole('radio', { name: theme, exact: true })
        .press('Space');
      await page.keyboard.press('Escape');
      const sizes = [];
      for (const name of ['Controller', 'Layout', 'Wiring', 'Encoders', 'Parts']) {
        const heading = editors.getByRole('heading', { name, exact: true });
        const row = name === 'Layout' ? heading : heading.locator('..');
        sizes.push(await row.boundingBox());
      }
      const first = sizes[0];
      if (!first) {
        throw new Error('Missing editor heading');
      }
      for (const size of sizes) {
        expect(size?.height).toBeCloseTo(40, 0);
        expect(size?.width).toBeCloseTo(first.width, 0);
      }
      const precise = editors.getByText('Precise properties', { exact: true });
      await precise.focus();
      await precise.press('Enter');
      await expect(
        editors.getByText('Select a switch and drag outside a corner to rotate.', { exact: false }),
      ).toBeVisible();
      await precise.press('Enter');
      await editors.getByRole('heading', { name: 'Layout', exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`editor-hierarchy-${width}-${theme}.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  expect(await saved(page)).toEqual(original);
});
