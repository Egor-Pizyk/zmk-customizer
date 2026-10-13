import { expect, test } from '@playwright/test';
import {
  at,
  beginDrag,
  center,
  corners,
  distance,
  drag,
  expectGeometry,
  expectPainted,
  expectPoint,
  fixture,
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

for (const angle of [0, 30]) {
  for (const direction of directions) {
    test(`resize ${direction.name} at ${angle}° preserves opposite anchor${angle === 30 && direction.name === 'bottom right' ? ' @cross-browser' : ''}`, async ({
      page,
    }) => {
      const project = {
        ...fixture,
        keys: fixture.keys.map((schematicKey, index) =>
          index === 0
            ? { ...schematicKey, rotationDeg: angle, rotationOriginXU: 5.5, rotationOriginYU: 5.5 }
            : schematicKey,
        ),
      };
      await openProject(page, project);
      await selectKey(page);
      const before = await saved(page);
      const previous = await corners(page);
      const start = await center(
        page.getByRole('button', { name: `Resize key 0 ${direction.name}`, exact: true }),
      );
      const radians = (angle * Math.PI) / 180;
      const scale = distance(at(previous, 0), at(previous, 1)) / 0.92;
      const end = {
        x: start.x + scale * (direction.x * Math.cos(radians) - direction.y * Math.sin(radians)),
        y: start.y + scale * (direction.x * Math.sin(radians) + direction.y * Math.cos(radians)),
      };
      await beginDrag(page, start, end);
      const expected = {
        ...project.keys[0],
        id: 'k0',
        xU: 5 + Math.min(0, direction.x),
        yU: 5 + Math.min(0, direction.y),
        widthU: direction.x === 0 ? 1 : 2,
        heightU: direction.y === 0 ? 1 : 2,
      };
      // Rotation is around the existing center; resizing rebases x/y to keep the opposite visual anchor.
      const preview = await corners(page);
      expectPoint(at(preview, direction.opposite), at(previous, direction.opposite));
      expect(distance(at(preview, 0), at(preview, 1))).toBeCloseTo(
        (expected.widthU - 0.08) * scale,
        1,
      );
      expect(distance(at(preview, 0), at(preview, 3))).toBeCloseTo(
        (expected.heightU - 0.08) * scale,
        1,
      );
      await expectPainted(page);
      expect(await saved(page), 'preview must remain unsaved').toEqual(before);
      await page.mouse.up();
      const result = await saved(page);
      expect(result.keys[0]?.widthU ?? 1).toBe(direction.x === 0 ? 1 : 2);
      expect(result.keys[0]?.heightU ?? 1).toBe(direction.y === 0 ? 1 : 2);
      const changed = result.keys[0];
      if (changed === undefined) {
        throw new Error('Missing resized key');
      }
      await expectGeometry(page, changed);
      expect(result.layers).toEqual(before.layers);
      expect(result.wires).toEqual(before.wires);
      expect(result.keys[0]?.diode).toEqual(before.keys[0]?.diode);
      await history(page, 'Undo').click();
      expect(await saved(page), 'one Undo restores complete pre-gesture project').toEqual(before);
      await expectGeometry(page, project.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
      await history(page, 'Redo').click();
      expect(await saved(page)).toEqual(result);
    });
  }
}
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

test('handles remain aligned after zoom and pan; grid snap and keyboard nudge @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  for (const zoom of [
    { action: 'Zoom out', count: 3 },
    { action: 'Zoom in', count: 7 },
  ]) {
    for (let index = 0; index < zoom.count; index++) {
      await page.getByRole('button', { name: zoom.action, exact: true }).click();
    }
    const surface = page.getByRole('application');
    const box = await surface.boundingBox();
    if (box === null) {
      throw new Error('Missing canvas');
    }
    const startPan = { x: box.x + box.width * 0.65, y: box.y + box.height * 0.65 };
    await page.mouse.move(startPan.x, startPan.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(startPan.x + 30, startPan.y + 20, { steps: 6 });
    await page.mouse.up({ button: 'middle' });
    const previous = await corners(page);
    const width = (await saved(page)).keys[0]?.widthU ?? 1;
    const pxPerU = distance(at(previous, 0), at(previous, 1)) / (width - 0.08);
    const handle = page.getByRole('button', { name: 'Resize key 0 right', exact: true });
    const start = await center(handle);
    const mark = await center(handle.locator('span'));
    expectPoint(start, mark);
    await drag(page, mark, { x: mark.x + pxPerU * 0.31, y: mark.y });
    expect((await saved(page)).keys[0]?.widthU).toBeCloseTo(width + 0.25, 4);
    expectPoint(at(await corners(page), 0), at(previous, 0));
  }
  await key(page).focus();
  const before = await saved(page);
  await page.keyboard.press('Shift+ArrowRight');
  expect((await saved(page)).keys[0]?.xU).toBeCloseTo((before.keys[0]?.xU ?? 0) + 0.25, 4);
  await expectGeometry(page, (await saved(page)).keys[0] ?? { id: 'k0', xU: 0, yU: 0 });
});

test('Escape cancels live resize; stationary handle click preserves Redo; overlap is explained @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  let start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await drag(page, start, { x: start.x + 48, y: start.y });
  const changed = await saved(page);
  await history(page, 'Undo').click();
  start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await page.mouse.click(start.x, start.y);
  await expect(history(page, 'Redo')).toBeEnabled();
  await beginDrag(page, start, { x: start.x + 96, y: start.y });
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 3 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  expect(await saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(changed);
  await selectKey(page);
  start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await beginDrag(page, start, { x: start.x + 240, y: start.y });
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('Keys cannot overlap');
  expect(await saved(page)).toEqual(changed);
  await expectGeometry(page, changed.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
});

test('pointer capture is cancelled by workspace removal; project Undo during preview cannot commit stale geometry @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await selectKey(page);
  const before = await saved(page);
  let start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await drag(page, start, { x: start.x + 48, y: start.y });
  start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await beginDrag(page, start, { x: start.x + 48, y: start.y });
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 3 });
  await page.keyboard.press('Control+z');
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  await selectKey(page);
  start = await center(page.getByRole('button', { name: 'Resize key 0 right', exact: true }));
  await beginDrag(page, start, { x: start.x + 48, y: start.y });
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 2 });
  await page.keyboard.press('Alt+Shift+Digit2');
  await expect(page.getByRole('heading', { name: 'Bindings', level: 1 })).toBeVisible();
  await page.mouse.up();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Alt+Shift+Digit1');
  await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  await expect(history(page, 'Redo')).toBeEnabled();
});

test('create a key using Add key, select its displayed body, move snapped/free and restore complete project', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Start new project', exact: true }).click();
  await page.getByRole('button', { name: 'Add key', exact: true }).click();
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
  await selectKey(page);
  await expect(page.getByRole('button', { name: /^Resize key 0 /u })).toHaveCount(8);
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
