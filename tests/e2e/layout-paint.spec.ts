import { expect, test } from '@playwright/test';
import {
  at,
  beginDrag,
  center,
  corners,
  distance,
  expectGeometry,
  expectPainted,
  fixture,
  key,
  openProject,
  saved,
  selectKey,
} from './helpers';

test('precise properties keep selected key and unsaved preview visibly inside canvas @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  await expectPainted(page);
  await page.getByText('Precise properties', { exact: true }).click();
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Selected width (u)', exact: true });
  await width.fill('2');
  await width.press('Enter');
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 2 });
  await expectPainted(page);
  expect(await saved(page)).toEqual(before);
});

test('reviewed rotated selection frame and live preview paint', async ({ page }, testInfo) => {
  const project = {
    ...fixture,
    keys: fixture.keys.map((schematicKey, index) =>
      index === 0
        ? { ...schematicKey, rotationDeg: 30, rotationOriginXU: 5.5, rotationOriginYU: 5.5 }
        : schematicKey,
    ),
  };
  await openProject(page, project);
  await selectKey(page);
  await expect(page.getByRole('button', { name: /^Resize key 0 /u })).toHaveCount(8);
  await expect(page.getByRole('button', { name: /^Resize key 1 /u })).toHaveCount(0);
  const previous = await corners(page);
  const start = await center(
    page.getByRole('button', { name: 'Resize key 0 bottom right', exact: true }),
  );
  const scale = distance(at(previous, 0), at(previous, 1)) / 0.92;
  await beginDrag(page, start, {
    x: start.x + scale * (Math.cos(Math.PI / 6) - Math.sin(Math.PI / 6)),
    y: start.y + scale * (Math.sin(Math.PI / 6) + Math.cos(Math.PI / 6)),
  });
  await expectPainted(page);
  expect(await saved(page)).toEqual(project);
  const points = await corners(page);
  const clip = {
    x: Math.floor(Math.min(...points.map(({ x }) => x)) - 35),
    y: Math.floor(Math.min(...points.map(({ y }) => y)) - 35),
    width: 200,
    height: 200,
  };
  // Fixed crop isolates key art, thin frame and handles; no whole-page snapshot or shared expected geometry code.
  await expect(page).toHaveScreenshot(`rotated-preview-${testInfo.project.name}.png`, {
    clip,
    maxDiffPixels: 20,
    threshold: 0.15,
  });
  await page.mouse.up();
  const geometry = (await saved(page)).keys[0];
  if (geometry === undefined) {
    throw new Error('Missing key');
  }
  await expectGeometry(page, geometry);
  await expect(key(page).locator('rect').first()).toBeVisible();
});

test('compact desktop keeps canvas usable when precise properties expand @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  await page.getByText('Precise properties', { exact: true }).click();
  await expectPainted(page);
  const width = page.getByRole('spinbutton', { name: 'Selected width (u)', exact: true });
  await width.fill('2');
  await width.press('Enter');
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 2 });
  await expectPainted(page);
  expect(await saved(page)).toEqual(before);
});
