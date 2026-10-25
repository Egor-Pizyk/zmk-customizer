import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import type { Key, Project } from '@domain';
import { parseProjectFile } from '@storage/project';

export type Point = { readonly x: number; readonly y: number };
export const fixture: Project = {
  schemaVersion: 13,
  encoders: [],
  combos: [],
  macros: [],
  conditionalLayers: [],
  behaviors: [],
  firmware: {},
  controllerId: 'nice_nano_v2',
  name: 'Browser shield',
  shieldName: 'browser_shield',
  keys: [
    { id: 'k0', xU: 5, yU: 5, diode: { pin: 1, cathode: 'away-switch' } },
    { id: 'k1', xU: 10, yU: 5 },
  ],
  wires: [
    {
      id: 'w0',
      start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
      end: { kind: 'free', at: { xU: 3, yU: 5.3667 }, boardPin: 2 },
      bends: [],
    },
    {
      id: 'w1',
      start: { kind: 'key-pin', keyId: 'k0', pin: 2 },
      end: { kind: 'free', at: { xU: 8, yU: 5.2333 }, boardPin: 8 },
      bends: [],
    },
  ],
  insulatedCrossings: [],
  layers: [
    {
      id: 'l0',
      name: 'Base',
      bindings: { k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } }, k1: { kind: 'trans' } },
    },
    {
      id: 'l1',
      name: 'Nav',
      bindings: { k0: { kind: 'kp', key: { keycode: 'B', modifiers: [] } }, k1: { kind: 'none' } },
    },
  ],
};
export const wiredFixture: Project = {
  ...fixture,
  keys: fixture.keys.slice(0, 1),
  layers: fixture.layers.map((layer) => ({
    ...layer,
    bindings: { k0: layer.bindings['k0'] ?? { kind: 'none' } },
  })),
};

export async function importText(page: Page, content: string) {
  await page.getByRole('banner').getByRole('button', { name: 'Open', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose file…' }).click();
  await (
    await chooser
  ).setFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(content) });
}
export async function openProject(page: Page, project: Project = fixture) {
  await page.goto('/');
  await importText(page, JSON.stringify(project));
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(project.name);
  await expect.poll(() => saved(page)).toEqual(project);
  await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
}
export async function saved(page: Page): Promise<Project> {
  const text = await page.evaluate(() => localStorage.getItem('zmk-customizer:project'));
  const result = parseProjectFile(text ?? '');
  if (!result.ok) {
    throw new Error(`Saved project failed parsing: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}
export function key(page: Page, keyIndex = 0) {
  // Playwright's role list omits the WAI-ARIA Graphics module; retain its role/name contract.
  return page.locator(
    `[role="graphics-symbol"][aria-label^="Key ${keyIndex} "], [role="graphics-symbol"][aria-label^="Key ${keyIndex},"]`,
  );
}
export function history(page: Page, action: 'Undo' | 'Redo') {
  return page.getByRole('banner').getByRole('button', { name: new RegExp(`^${action}`, 'u') });
}
export async function center(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('Displayed target has no bounds');
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
export async function selectKey(page: Page, keyIndex = 0) {
  const point = await center(key(page, keyIndex));
  // Match native integer pointer coordinates before clicking near rotated controls.
  await page.mouse.click(Math.round(point.x), Math.round(point.y));
  await expect(
    page.getByRole('checkbox', { name: `Select key ${keyIndex}`, exact: true }),
  ).toBeChecked();
}
export async function beginDrag(page: Page, start: Point, end: Point) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 4 });
  await page.mouse.move(end.x, end.y, { steps: 4 });
}
export async function drag(page: Page, start: Point, end: Point) {
  await beginDrag(page, start, end);
  await page.mouse.up();
}
export async function corners(page: Page, keyIndex = 0): Promise<Point[]> {
  return key(page, keyIndex)
    .locator('rect')
    .first()
    .evaluate((element) => {
      if (!(element instanceof SVGRectElement)) {
        throw new Error('Expected displayed SVG rectangle');
      }
      const matrix = element.getScreenCTM();
      if (matrix === null) {
        throw new Error('Missing screen transform');
      }
      const x = element.x.baseVal.value;
      const y = element.y.baseVal.value;
      const width = element.width.baseVal.value;
      const height = element.height.baseVal.value;
      return [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ].map(([px = 0, py = 0]) => {
        const point = new DOMPoint(px, py).matrixTransform(matrix);
        return { x: point.x, y: point.y };
      });
    });
}
export function at(points: readonly Point[], index: number): Point {
  const point = points[index];
  if (point === undefined) {
    throw new Error(`Missing corner ${index}`);
  }
  return point;
}
export function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
export function expectPoint(actual: Point, expected: Point) {
  expect(distance(actual, expected), 'displayed corner distance in CSS pixels').toBeLessThan(0.75);
}
export async function expectGeometry(page: Page, geometry: Key, keyIndex = 0) {
  const matrix = await key(page, keyIndex).evaluate((element) => {
    const parent = element.parentElement;
    if (!(parent instanceof SVGGraphicsElement)) {
      throw new Error('Missing world layer');
    }
    const viewportMatrix = parent.getScreenCTM();
    if (viewportMatrix === null) {
      throw new Error('Missing viewport matrix');
    }
    return {
      a: viewportMatrix.a,
      b: viewportMatrix.b,
      c: viewportMatrix.c,
      d: viewportMatrix.d,
      e: viewportMatrix.e,
      f: viewportMatrix.f,
    };
  });
  const angle = ((geometry.rotationDeg ?? 0) * Math.PI) / 180;
  const originX = geometry.rotationOriginXU ?? 0;
  const originY = geometry.rotationOriginYU ?? 0;
  const width = geometry.widthU ?? 1;
  const height = geometry.heightU ?? 1;
  const expected = [
    [geometry.xU + 0.04, geometry.yU + 0.04],
    [geometry.xU + width - 0.04, geometry.yU + 0.04],
    [geometry.xU + width - 0.04, geometry.yU + height - 0.04],
    [geometry.xU + 0.04, geometry.yU + height - 0.04],
  ].map(([x = 0, y = 0]) => {
    const rotatedX = originX + (x - originX) * Math.cos(angle) - (y - originY) * Math.sin(angle);
    const rotatedY = originY + (x - originX) * Math.sin(angle) + (y - originY) * Math.cos(angle);
    return {
      x: matrix.a * rotatedX + matrix.c * rotatedY + matrix.e,
      y: matrix.b * rotatedX + matrix.d * rotatedY + matrix.f,
    };
  });
  await expect
    .poll(async () => {
      const actual = await corners(page, keyIndex);
      return Math.max(...actual.map((point, index) => distance(point, at(expected, index))));
    })
    .toBeLessThan(0.75);
  const actual = await corners(page, keyIndex);
  for (const [index, point] of actual.entries()) {
    expectPoint(point, at(expected, index));
  }
}
export async function editNumber(page: Page, name: string, value: string) {
  const input = page.getByRole('spinbutton', { name, exact: true });
  await input.fill(value);
  await input.press('Enter');
}
export async function workspace(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Workspaces' })
    .getByRole('button', { name: new RegExp(`^${name}(,|$)`, 'u') })
    .click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}
export async function downloadJson(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('banner').getByRole('button', { name: 'Save', exact: true }).click();
  const path = await (await pending).path();
  return readFile(path, 'utf8');
}
export async function downloadZip(page: Page) {
  await workspace(page, 'Export');
  const button = page.getByRole('button', { name: 'Download .zip', exact: true });
  await expect(button).toBeEnabled();
  const pending = page.waitForEvent('download');
  await button.click();
  const path = await (await pending).path();
  return Object.fromEntries(
    Object.entries(unzipSync(await readFile(path))).map(([name, bytes]) => [
      name,
      strFromU8(bytes),
    ]),
  );
}

export async function expectPainted(page: Page, keyIndex = 0) {
  const surface = await page.getByRole('application').boundingBox();
  if (surface === null) {
    throw new Error('Missing visible surface');
  }
  const points = await corners(page, keyIndex);
  for (const point of points) {
    expect(point.x, 'key corner inside visible canvas horizontally').toBeGreaterThanOrEqual(
      surface.x,
    );
    expect(point.x).toBeLessThanOrEqual(surface.x + surface.width);
    expect(point.y, 'key corner inside visible canvas vertically').toBeGreaterThanOrEqual(
      surface.y,
    );
    expect(point.y, 'key corner must not be clipped by panels').toBeLessThanOrEqual(
      surface.y + surface.height,
    );
  }
  const paint = await key(page, keyIndex).evaluate((element) => {
    let current: Element | null = element;
    let opacity = 1;
    while (current !== null) {
      const style = getComputedStyle(current);
      if (style.visibility === 'hidden' || style.display === 'none') {
        return 0;
      }
      opacity *= Number(style.opacity);
      current = current.parentElement;
    }
    return opacity;
  });
  expect(paint, 'rendered key must remain painted').toBeGreaterThan(0.99);
}
