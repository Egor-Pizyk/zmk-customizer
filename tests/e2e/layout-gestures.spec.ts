import { expect, test } from '@playwright/test';
import {
  at,
  beginDrag,
  center,
  corners,
  distance,
  drag,
  expectGeometry,
  history,
  key,
  openProject,
  saved,
  selectKey,
} from './helpers';

const directions = [
  { name: 'top left', x: -1, y: -1, opposite: 2 },
  { name: 'top', x: 0, y: -1, opposite: 2 },
  { name: 'top right', x: 1, y: -1, opposite: 3 },
  { name: 'right', x: 1, y: 0, opposite: 0 },
  { name: 'bottom right', x: 1, y: 1, opposite: 0 },
  { name: 'bottom', x: 0, y: 1, opposite: 0 },
  { name: 'bottom left', x: -1, y: 1, opposite: 1 },
  { name: 'left', x: -1, y: 0, opposite: 1 },
] as const;

for (const direction of directions.filter(({ x, y }) => x !== 0 && y !== 0)) {
  test(`rotate outside ${direction.name} preserves center @cross-browser`, async ({ page }) => {
    await openProject(page);
    await selectKey(page);
    const before = await saved(page);
    const previous = await corners(page);
    const pivot = {
      x: (at(previous, 0).x + at(previous, 2).x) / 2,
      y: (at(previous, 0).y + at(previous, 2).y) / 2,
    };
    const start = await center(
      page.getByRole('button', { name: `Rotate key 0 ${direction.name}`, exact: true }),
    );
    const angle = (43 * Math.PI) / 180;
    const end = {
      x: pivot.x + (start.x - pivot.x) * Math.cos(angle) - (start.y - pivot.y) * Math.sin(angle),
      y: pivot.y + (start.x - pivot.x) * Math.sin(angle) + (start.y - pivot.y) * Math.cos(angle),
    };
    await page.keyboard.down('Shift');
    await beginDrag(page, start, end);
    await expectGeometry(page, {
      id: 'k0',
      xU: 5,
      yU: 5,
      rotationDeg: 45,
      rotationOriginXU: 5.5,
      rotationOriginYU: 5.5,
    });
    expect(await saved(page)).toEqual(before);
    await page.mouse.up();
    await page.keyboard.up('Shift');
    const result = await saved(page);
    expect(result.keys[0]).toMatchObject({
      xU: 5,
      yU: 5,
      rotationDeg: 45,
      rotationOriginXU: 5.5,
      rotationOriginYU: 5.5,
    });
    await expect(
      page.getByRole('checkbox', { name: 'Select key 1', exact: true }),
    ).not.toBeChecked();
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(before);
  });
}

test('create a key using Add key, select its displayed body, move snapped/free and restore complete project', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Start empty project', exact: true }).click();
  await page.getByRole('button', { name: 'Add key', exact: true }).click();
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
  await selectKey(page);
  await expect(page.getByRole('button', { name: /^Resize key 0 /u })).toHaveCount(0);
  const before = await saved(page);
  const geometry = before.keys[0];
  if (geometry === undefined) {
    throw new Error('Missing new key');
  }
  const previous = await corners(page);
  const scale = distance(at(previous, 0), at(previous, 1)) / 0.92;
  let start = await center(key(page));
  await drag(page, start, { x: start.x + scale * 0.31, y: start.y });
  const snapped = await saved(page);
  expect(snapped.keys[0]?.xU).toBeCloseTo(geometry.xU + 0.25, 4);
  await expectGeometry(page, snapped.keys[0] ?? geometry);
  await page.getByRole('button', { name: 'Snap to grid', exact: true }).click();
  start = await center(key(page));
  await drag(page, start, { x: start.x + scale * 0.31, y: start.y });
  const free = await saved(page);
  expect(free.keys[0]?.xU).toBeCloseTo(geometry.xU + 0.56, 1);
  await expectGeometry(page, free.keys[0] ?? geometry);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(snapped);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await expectGeometry(page, geometry);
});

test('rotation preview cancels on Escape and stale selection; no-motion preserves Redo @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  const points = await corners(page);
  const pivot = {
    x: (at(points, 0).x + at(points, 2).x) / 2,
    y: (at(points, 0).y + at(points, 2).y) / 2,
  };
  const start = await center(
    page.getByRole('button', { name: 'Rotate key 0 bottom right', exact: true }),
  );
  const end = { x: pivot.x - (start.y - pivot.y), y: pivot.y + (start.x - pivot.x) };
  await page.keyboard.down('Shift');
  await beginDrag(page, start, end);
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  await drag(page, start, end);
  const changed = await saved(page);
  expect(changed.keys[0]?.rotationDeg).toBe(90);
  await history(page, 'Undo').click();
  await page.mouse.click(start.x, start.y);
  await expect(history(page, 'Redo')).toBeEnabled();
  await beginDrag(page, start, end);
  await key(page, 1).focus();
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.up('Shift');
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(changed);
});
