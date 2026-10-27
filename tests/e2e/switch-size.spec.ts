import { expect, test } from './test';
import {
  at,
  beginDrag,
  center,
  corners,
  expectGeometry,
  expectPainted,
  fixture,
  history,
  key,
  openProject,
  saved,
  selectKey,
  workspace,
} from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`switch sizing unavailable; keycap sizing and center rotation retained ${theme} @cross-browser`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1024, height: 800 });
    await openProject(page, fixture);
    await selectKey(page);
    await expect(page.getByRole('button', { name: /^Resize key/u })).toHaveCount(0);
    await expect(page.getByRole('spinbutton', { name: /width|height/iu })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Rotate key 0/u })).toHaveCount(1);
    await expect(
      page.getByRole('spinbutton', { name: 'Key 0 Rotation (°)', exact: true }),
    ).toBeVisible();
    await workspace(page, 'Bindings');
    await key(page).click({ button: 'right' });
    await page
      .getByRole('dialog', { name: 'Keycap size', exact: true })
      .getByRole('button', { name: '2.25 × 1 u', exact: true })
      .click();
    const sized = await saved(page);
    expect(sized.keys[0]?.widthU).toBe(2.25);
    await workspace(page, 'Schematic');
    if (!(await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).isVisible())) {
      await page.getByText('Parts', { exact: true }).click();
    }
    await selectKey(page);
    await expectGeometry(page, sized.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
    await expect(page.getByRole('button', { name: /^Resize key/u })).toHaveCount(0);
    await expect(page.getByRole('spinbutton', { name: /width|height/iu })).toHaveCount(0);
    const points = await corners(page);
    const pivot = {
      x: (at(points, 0).x + at(points, 2).x) / 2,
      y: (at(points, 0).y + at(points, 2).y) / 2,
    };
    const handle = page.getByRole('button', { name: 'Rotate key 0 bottom right', exact: true });
    const start = await center(handle);
    // Frame is 0.08u wider than the painted key; rotation target is another 20px outside it.
    const pxPerU = (at(points, 1).x - at(points, 0).x) / (2.25 - 0.08);
    expect(start.x).toBeCloseTo(pivot.x + (2.25 * pxPerU) / 2 + 20, 0);
    expect(start.y).toBeCloseTo(pivot.y + pxPerU / 2 + 20, 0);
    await page.keyboard.down('Shift');
    await beginDrag(page, start, {
      x: pivot.x - (start.y - pivot.y),
      y: pivot.y + (start.x - pivot.x),
    });
    expect(await saved(page)).toEqual(sized);
    await expectPainted(page);
    await expect(key(page).locator('rect').first()).toHaveCSS('opacity', '1');
    await page.screenshot({ path: testInfo.outputPath(`switch-rotation-${theme}.png`) });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    const rotated = await saved(page);
    expect(rotated.keys[0]).toMatchObject({ widthU: 2.25, heightU: 1, rotationDeg: 90 });
    await expectGeometry(page, rotated.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
    const after = await corners(page);
    expect((at(after, 0).x + at(after, 2).x) / 2).toBeCloseTo(pivot.x, 0);
    expect((at(after, 0).y + at(after, 2).y) / 2).toBeCloseTo(pivot.y, 0);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(sized);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(rotated);
  });
}
