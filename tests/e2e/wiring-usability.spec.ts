import { test, expect } from '@playwright/test';
import {
  fixture,
  openProject,
  saved,
  center,
  key,
  drag,
  history,
  downloadJson,
  downloadZip,
} from './helpers';
import { getNets } from '@domain/wires/nets';
import { getKeyPinWires } from '@domain/wires';
import { getWiringCells } from '@domain/wiring/matrix';
import type { Locator } from '@playwright/test';
import type { Project } from '@domain';

const source: Project = {
  ...fixture,
  keys: [
    { id: 'k0', xU: 5, yU: 5 },
    { id: 'k1', xU: 7, yU: 5 },
    { id: 'k2', xU: 9, yU: 5 },
  ],
  wires: [],
  insulatedCrossings: [],
  layers: [{ id: 'l0', name: 'Base', bindings: {} }],
};

test('drawn intermediate connections survive a real endpoint move and section deletion @cross-browser', async ({
  page,
}) => {
  await openProject(page, source);
  await page.getByRole('radio', { name: 'Wire', exact: true }).press('Space');
  const start = await center(page.locator('[data-key-id="k0"][data-pin="1"] circle').first());
  const end = await center(page.locator('[data-key-id="k2"][data-pin="1"] circle').first());
  await page.mouse.click(start.x, start.y);
  await page.mouse.click(end.x, end.y);
  await expect.poll(async () => (await saved(page)).wires.length).toBe(1);
  expect(getKeyPinWires(await saved(page))({ keyId: 'k1', pin: 1 })).toEqual([0]);
  await page.getByRole('radio', { name: 'Select', exact: true }).press('Space');
  const point = await center(key(page, 0));
  await drag(page, point, { x: point.x, y: point.y + 96 });
  await expect.poll(async () => (await saved(page)).keys[0]?.yU).not.toBe(5);
  const moved = await saved(page);
  expect(getKeyPinWires(moved)({ keyId: 'k1', pin: 1 })).toEqual([0]);
  await expect(page.locator('[data-section-id]')).toHaveCount(3);
  const section = page.getByRole('checkbox', { name: /^Section 1,/u });
  await section.check();
  await page.getByRole('button', { name: 'Delete selected sections', exact: true }).click();
  expect((await saved(page)).keys).toEqual(moved.keys);
  expect((await saved(page)).wires).not.toEqual(moved.wires);
  expect(pinsOnMiddle(await saved(page))).toEqual([
    { keyId: 'k1', pin: 1 },
    { keyId: 'k2', pin: 1 },
  ]);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(moved);
  expect(JSON.parse(await downloadJson(page))).toEqual(moved);
  const spans = page.locator('[data-section-id] path[pointer-events="stroke"]');
  const first = await sectionPoint(spans.nth(0));
  const second = await sectionPoint(spans.nth(1));
  await page.mouse.click(first.x, first.y);
  await page.keyboard.down('Shift');
  await page.mouse.click(second.x, second.y);
  await page.keyboard.up('Shift');
  await expect(page.locator('[data-section-id] path[data-selected="true"]')).toHaveCount(2);
  await page.locator('[data-canvas-workspace="schematic"]').press('Delete');
  expect((await saved(page)).keys).toEqual(moved.keys);
  expect((await saved(page)).wires).not.toEqual(moved.wires);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(moved);
  await page.reload();
  expect(getKeyPinWires(await saved(page))({ keyId: 'k1', pin: 1 })).toEqual([0]);
});

test('completion previews safely, preserves existing conductors and reports a no-op @cross-browser', async ({
  page,
}) => {
  const partial: Project = {
    ...source,
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: 3, yU: 5.3667 }, boardPin: 4 },
        bends: [],
      },
    ],
  };
  await openProject(page, partial);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Complete wiring', exact: true }).click();
  await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(partial);
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  expect(await saved(page)).toEqual(partial);
  await page.getByRole('button', { name: 'Complete wiring', exact: true }).click();
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const complete = await saved(page);
  expect(getWiringCells(complete).map((cell) => [cell.row, cell.col])).toEqual([
    [0, 0],
    [0, 1],
    [0, 2],
  ]);
  await page.getByRole('button', { name: 'Complete wiring', exact: true }).click();
  await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(complete);
  expect(complete.wires[0]).toMatchObject({
    id: 'w1',
    bends: [],
    end: { at: { xU: 3, yU: 5.3667 } },
  });
  const files = await downloadZip(page);
  expect(files['boards/shields/browser_shield/browser_shield.overlay']).toContain(
    '<&pro_micro 4 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>',
  );
  expect(files['boards/shields/browser_shield/browser_shield.overlay']).toContain('RC(0,2)');
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(partial);
});

async function sectionPoint(section: Locator) {
  return section.evaluate((element) => {
    if (!(element instanceof SVGPathElement)) {
      throw new Error('Missing wire path');
    }
    const matrix = element.getScreenCTM();
    if (matrix === null) {
      throw new Error('Missing wire transform');
    }
    const point = element.getPointAtLength(element.getTotalLength() / 2).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  });
}

function pinsOnMiddle(project: Project) {
  return getNets(project).find((net) => net.pins.some((pin) => pin.keyId === 'k1' && pin.pin === 1))
    ?.pins;
}
