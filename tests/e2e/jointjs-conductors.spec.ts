import { expect, test } from './test';
import type { Locator } from '@playwright/test';
import {
  fixture,
  openProject,
  center,
  saved,
  beginDrag,
  drag,
  history,
  key,
  downloadJson,
  importText,
} from './helpers';
import { addWire } from '@domain/wires/editing';
import { getNets } from '@domain/wires/nets';

const source = {
  ...fixture,
  keys: [
    { id: 'k0', xU: 5, yU: 5 },
    { id: 'k1', xU: 7, yU: 5 },
    { id: 'k2', xU: 9, yU: 5 },
  ],
  wires: [],
  layers: [{ id: 'l0', name: 'Base', bindings: {} }],
};

async function sectionPoint(section: Locator) {
  return section.evaluate((element) => {
    if (!(element instanceof SVGPathElement)) {
      throw new Error('Missing section');
    }
    const matrix = element.getScreenCTM();
    if (matrix === null) {
      throw new Error('Missing matrix');
    }
    const point = element.getPointAtLength(element.getTotalLength() / 2).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  });
}

test('native corner targets preserve section clicks, cancellation and consecutive corner edits @cross-browser', async ({
  page,
}) => {
  const project = {
    ...source,
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin' as const, keyId: 'k0', pin: 1 as const },
        end: { kind: 'free' as const, at: { xU: 9, yU: 7 }, boardPin: 4 },
        bends: [{ xU: 7, yU: 7 }],
      },
    ],
  };
  await openProject(page, project);
  const section = page.locator('[data-section-id] path[pointer-events="stroke"]').first();
  const point = await sectionPoint(section);
  await page.mouse.click(point.x, point.y);
  expect(await saved(page)).toEqual(project);
  const handle = page.locator('[data-bend-index="0"]');
  const bounds = await handle.boundingBox();
  expect(bounds?.width).toBeCloseTo(24, 3);
  expect(bounds?.height).toBeCloseTo(24, 3);
  const start = await center(handle);
  await beginDrag(page, start, { x: start.x + 48, y: start.y - 48 });
  expect(await saved(page)).toEqual(project);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await saved(page)).toEqual(project);
  await drag(page, start, { x: start.x + 48, y: start.y - 48 });
  const moved = await saved(page);
  expect(moved.wires[0]?.bends).toEqual([{ xU: 8, yU: 6 }]);
  const straight = await sectionPoint(section);
  await drag(page, await center(handle), straight);
  expect((await saved(page)).wires[0]?.bends).toEqual([]);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(moved);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(project);
});

for (const keyIndex of [0, 1, 2]) {
  test(`A–B–C contact ownership survives independent movement of key ${keyIndex} @cross-browser`, async ({
    page,
  }) => {
    const project = addWire(source, {
      start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
      end: { kind: 'key-pin', keyId: 'k2', pin: 1 },
      bends: [],
    });
    await openProject(page, project);
    const start = await center(key(page, keyIndex));
    await drag(page, start, { x: start.x, y: start.y + 48 });
    const moved = await saved(page);
    expect(moved.keys[keyIndex]?.yU).toBe(6);
    expect(moved.wires[0]?.contacts).toEqual([
      { keyId: 'k1', pin: 1, at: { xU: 7.3, yU: 5.3667 } },
    ]);
    const net = getNets(moved).find((entry) =>
      entry.pins.some((pin) => pin.keyId === 'k0' && pin.pin === 1),
    );
    expect(net?.pins).toEqual([
      { keyId: 'k0', pin: 1 },
      { keyId: 'k1', pin: 1 },
      { keyId: 'k2', pin: 1 },
    ]);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(project);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(moved);
    await page.reload();
    expect(await saved(page)).toEqual(moved);
    expect(JSON.parse(await downloadJson(page))).toEqual(moved);
  });
}

test('multiple crossings preserve the saved ordinal bridge and exact electrical sections', async ({
  page,
}) => {
  const project = {
    ...source,
    keys: [],
    wires: [
      {
        id: 'w1',
        start: { kind: 'free' as const, at: { xU: 5, yU: 6 } },
        end: { kind: 'free' as const, at: { xU: 9, yU: 6 } },
        bends: [],
      },
      {
        id: 'w2',
        start: { kind: 'free' as const, at: { xU: 6, yU: 5 } },
        end: { kind: 'free' as const, at: { xU: 8, yU: 5 } },
        bends: [
          { xU: 6, yU: 7 },
          { xU: 8, yU: 7 },
        ],
      },
    ],
    insulatedCrossings: [{ wireIds: ['w1', 'w2'] as const, ordinal: 1 }],
  };
  await page.goto('/');
  await importText(page, JSON.stringify(project));
  await expect.poll(() => saved(page)).toEqual(project);
  await expect(
    page.locator('.joint-paper path[d="M 8 5.875 A 0.125 0.125 0 0 1 8 6.125"]'),
  ).toHaveCount(1);
  const paths = await page
    .locator('[data-section-id] path[pointer-events="none"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('d')));
  expect(paths.toSorted((first, second) => String(first).localeCompare(String(second)))).toEqual(
    ['M 5 6 L 6 6', 'M 6 6 L 9 6', 'M 6 5 L 6 6', 'M 6 6 L 6 7 L 8 7 L 8 5'].toSorted(
      (first, second) => first.localeCompare(second),
    ),
  );
  expect(await saved(page)).toEqual(project);
  await page.reload();
  await expect(page.locator('.joint-paper path[d*=" A "]')).toHaveCount(1);
  expect(JSON.parse(await downloadJson(page))).toEqual(project);
});

test('overlapping wires paint one shared interval while keeping independent branches', async ({
  page,
}) => {
  const project = {
    ...source,
    keys: [],
    wires: [
      {
        id: 'w1',
        start: { kind: 'free' as const, at: { xU: 5, yU: 5 } },
        end: { kind: 'free' as const, at: { xU: 10, yU: 7 } },
        bends: [{ xU: 10, yU: 5 }],
      },
      {
        id: 'w2',
        start: { kind: 'free' as const, at: { xU: 7, yU: 3 } },
        end: { kind: 'free' as const, at: { xU: 12, yU: 5 } },
        bends: [{ xU: 7, yU: 5 }],
      },
    ],
  };
  await page.goto('/');
  await importText(page, JSON.stringify(project));
  await expect.poll(() => saved(page)).toEqual(project);
  const paths = page.locator('[data-section-id] path[pointer-events="none"]');
  await expect(paths).toHaveCount(5);
  await expect(
    page.locator('[data-section-id] path[pointer-events="none"][d="M 7 5 L 10 5"]'),
  ).toHaveCount(1);
  expect(
    await paths.evaluateAll((elements) => elements.map((element) => element.getAttribute('d'))),
  ).toEqual(
    expect.arrayContaining(['M 5 5 L 7 5', 'M 10 5 L 10 7', 'M 7 3 L 7 5', 'M 10 5 L 12 5']),
  );
  expect(await saved(page)).toEqual(project);
  await page.reload();
  await expect(paths).toHaveCount(5);
  expect(JSON.parse(await downloadJson(page))).toEqual(project);
});
