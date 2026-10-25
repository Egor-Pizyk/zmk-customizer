import { expect, test } from '@playwright/test';
import { fixture, openProject, saved, history, drag } from './helpers';
import type { Page } from '@playwright/test';
import type { Project, WirePoint } from '@domain';

const project: Project = {
  ...fixture,
  keys: [
    { id: 'k0', xU: 5, yU: 3 },
    { id: 'k1', xU: 9, yU: 9 },
  ],
  layers: [{ id: 'l0', name: 'Base', bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' } } }],
  wires: [
    {
      id: 'w1',
      start: { kind: 'free', at: { xU: 3, yU: 5 } },
      end: { kind: 'free', at: { xU: 11, yU: 5 } },
      bends: [],
    },
    {
      id: 'w2',
      start: { kind: 'free', at: { xU: 3, yU: 7 } },
      end: { kind: 'free', at: { xU: 11, yU: 11 } },
      bends: [],
    },
  ],
  insulatedCrossings: [],
};

for (const theme of ['light', 'dark'] as const) {
  test(`wire marquee intersects actual segments and mixed deletion is atomic in ${theme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page, project);
    await marquee(page, { start: { xU: 6, yU: 4.5 }, end: { xU: 8, yU: 5.5 } });
    await expect(page.locator('[data-section-id="w1:0:0"] path[data-selected]')).toHaveCount(1);
    expect(await saved(page)).toEqual(project);
    const blank = await screen(page, { xU: 6, yU: 6 });
    await page.mouse.click(blank.x, blank.y);
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(0);
    await marquee(page, { start: { xU: 6, yU: 4.5 }, end: { xU: 8, yU: 5.5 } });
    const canvas = page.locator('[data-canvas-workspace="schematic"]');
    await canvas.press('+');
    const panStart = await screen(page, { xU: 6, yU: 6 });
    await page.mouse.move(panStart.x, panStart.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(panStart.x + 16, panStart.y + 16, { steps: 4 });
    await page.mouse.up({ button: 'middle' });
    await marquee(page, { start: { xU: 6, yU: 4.5 }, end: { xU: 8, yU: 5.5 } });
    await expect(page.locator('[data-section-id="w1:0:0"] path[data-selected]')).toHaveCount(1);
    await marquee(page, { start: { xU: 6, yU: 8 }, end: { xU: 8, yU: 10 } });
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(0);
    await marquee(page, { start: { xU: 6.5, yU: 5.5 }, end: { xU: 4.5, yU: 2.5 } });
    await expect(page.getByRole('checkbox', { name: 'Select key 0', exact: true })).toBeChecked();
    await expect(page.locator('[data-section-id="w1:0:0"] path[data-selected]')).toHaveCount(1);
    await page.screenshot({ path: test.info().outputPath('mixed-marquee.png') });
    const start = await screen(page, { xU: 6, yU: 8 });
    const end = await screen(page, { xU: 8, yU: 10 });
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 4 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(page.getByRole('checkbox', { name: 'Select key 0', exact: true })).toBeChecked();
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(1);
    await page.keyboard.down('Shift');
    await marquee(page, { start: { xU: 8.5, yU: 8.5 }, end: { xU: 10.5, yU: 10.5 } });
    await page.keyboard.up('Shift');
    await expect(page.getByRole('checkbox', { name: 'Select key 1', exact: true })).toBeChecked();
    expect(await saved(page)).toEqual(project);
    await page.locator('[data-canvas-workspace="schematic"]').press('Delete');
    const deleted = await saved(page);
    expect(deleted.keys).toEqual([]);
    expect(deleted.wires).toEqual([project.wires[1]]);
    expect(deleted.layers[0]?.bindings).toEqual({});
    await history(page, 'Undo').click();
    await expect.poll(() => saved(page)).toEqual(project);
    await history(page, 'Redo').click();
    await expect.poll(() => saved(page)).toEqual(deleted);
    await page.reload();
    expect(await saved(page)).toEqual(deleted);
  });
}

test('list checkboxes build and remove the same mixed selection by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await openProject(page, project);
  const key = page.getByRole('checkbox', { name: 'Select key 0', exact: true });
  await key.focus();
  await key.press('Space');
  const section = page.getByRole('checkbox', { name: /^Section 1,/u });
  await section.focus();
  await section.press('Space');
  await expect(key).toBeChecked();
  await expect(page.locator('[data-section-id="w1:0:0"] path[data-selected]')).toHaveCount(1);
  const canvasKey = page.locator('[data-key-focus-id="k0"]');
  await canvasKey.focus();
  await canvasKey.press('Shift+ArrowRight');
  await expect.poll(async () => (await saved(page)).keys[0]?.xU).toBe(5.25);
  expect((await saved(page)).wires).toEqual(project.wires);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(project);
  await page.screenshot({ path: test.info().outputPath('mixed-keyboard-narrow.png') });
  const action = page.getByRole('button', {
    name: 'Delete selected keys and sections',
    exact: true,
  });
  await action.focus();
  await action.press('Enter');
  expect((await saved(page)).keys).toEqual([project.keys[1]]);
  expect((await saved(page)).wires).toEqual([project.wires[1]]);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(project);
});

async function screen(page: Page, point: WirePoint) {
  return page
    .locator('[data-section-id] path')
    .first()
    .evaluate((element, at) => {
      if (!(element instanceof SVGPathElement)) {
        throw new Error('Missing path');
      }
      const matrix = element.getScreenCTM();
      if (matrix === null) {
        throw new Error('Missing transform');
      }
      const result = new DOMPoint(at.xU, at.yU).matrixTransform(matrix);
      return { x: result.x, y: result.y };
    }, point);
}
async function marquee(page: Page, input: { readonly start: WirePoint; readonly end: WirePoint }) {
  await drag(page, await screen(page, input.start), await screen(page, input.end));
}
