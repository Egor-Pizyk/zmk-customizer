import { test, expect } from '@playwright/test';
import { openProject, saved } from './helpers';

test('keeps the canvas visible beside or above a bounded editor @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await expect(page.getByRole('button', { name: 'Collapse editors', exact: true })).toBeVisible();
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
      expect(panel.width).toBeLessThanOrEqual(Math.min(360, root.width * 0.35) + 1);
      expect(canvas.width).toBeGreaterThanOrEqual(root.width * 0.6);
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
  await page.getByRole('button', { name: 'Collapse editors', exact: true }).click();
  await page.getByRole('button', { name: 'Expand editors', exact: true }).click();
  await page.getByRole('button', { name: 'Close editors', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open editors', exact: true })).toBeFocused();
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
    await page.getByRole('button', { name: 'Complete wiring', exact: true }).click();
    await page.getByText('Controller', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toHaveCount(0);
    expect(await page.locator('details[name="schematic-editor"][open]').count()).toBe(1);
    expect(await saved(page)).toEqual(original);
    await page.screenshot({ path: info.outputPath(`panels-${theme.toLowerCase()}.png`) });
  }
});
