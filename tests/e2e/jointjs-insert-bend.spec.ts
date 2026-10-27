import { expect, test } from './test';
import { center, drag, fixture, history, openProject, saved } from './helpers';

test('Select double-click creates a square movable waypoint on a straight section @cross-browser', async ({
  page,
}) => {
  await openProject(page, {
    ...fixture,
    keys: [
      { id: 'k0', xU: 5, yU: 9 },
      { id: 'k1', xU: 9, yU: 9 },
    ],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    wires: [
      {
        id: 'w1',
        start: { kind: 'free', at: { xU: 5, yU: 5 } },
        end: { kind: 'free', at: { xU: 9, yU: 7 } },
        bends: [],
      },
    ],
    insulatedCrossings: [],
  });
  const before = await saved(page);
  const point = await page
    .locator('[data-section-id] path[pointer-events="stroke"]')
    .evaluate((node) => {
      if (!(node instanceof SVGPathElement)) {
        throw new Error('Missing wire');
      }
      const matrix = node.getScreenCTM();
      if (matrix === null) {
        throw new Error('Missing wire transform');
      }
      const at = node.getPointAtLength(2).matrixTransform(matrix);
      return { x: at.x, y: at.y };
    });
  await page.mouse.dblclick(point.x, point.y);
  await expect.poll(async () => (await saved(page)).wires[0]?.bends.length).toBe(1);
  const inserted = await saved(page);
  const handle = page.locator('[data-wire-bend][data-bend-index="0"]');
  await expect(handle).toBeVisible();
  await expect(handle.locator('rect[pointer-events="none"]')).toHaveCount(1);
  await expect(handle.locator('circle')).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('inserted-square-before-drag.png') });
  const start = await center(handle);
  await drag(page, start, { x: start.x, y: start.y - 48 });
  await expect
    .poll(async () => (await saved(page)).wires[0]?.bends)
    .not.toEqual(inserted.wires[0]?.bends);
  const moved = await saved(page);
  expect(moved.wires[0]?.start).toEqual(before.wires[0]?.start);
  expect(moved.wires[0]?.end).toEqual(before.wires[0]?.end);
  expect(moved.wires[0]?.bends).toEqual([{ xU: 7, yU: 4 }]);
  await page.screenshot({ path: test.info().outputPath('inserted-square-dragged.png') });
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(inserted);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(inserted);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(moved);
});
