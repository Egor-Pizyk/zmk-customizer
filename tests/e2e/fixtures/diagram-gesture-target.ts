import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';

export const DIAGRAM_SCENARIOS = ['single-key', 'multi-key', 'corner', 'pan'] as const;
type Scenario = (typeof DIAGRAM_SCENARIOS)[number];

export async function startDiagramGesture(page: Page, scenario: Scenario) {
  if (scenario === 'multi-key') {
    await page.getByRole('checkbox', { name: 'Select key 44', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select key 45', exact: true }).check();
  }
  const reference = await readPairedReference(scenario);
  const origin = await gestureOrigin(page, scenario, reference);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down({ button: scenario === 'pan' ? 'middle' : 'left' });
  return origin;
}
async function worldPoint(page: Page, point: { readonly x: number; readonly y: number }) {
  return page
    .locator('[data-section-id] path')
    .first()
    .evaluate((element, at) => {
      if (!(element instanceof SVGGraphicsElement)) {
        throw new Error('Missing SVG geometry');
      }
      const matrix = element.getScreenCTM();
      if (matrix === null) {
        throw new Error('Missing world matrix');
      }
      const transformed = new DOMPoint(at.x, at.y).matrixTransform(matrix);
      return { x: transformed.x, y: transformed.y };
    }, point);
}
async function cornerOrigin(page: Page, reference: PairedReference | undefined) {
  return page.locator('[data-wire-bend]').evaluateAll((elements, expected) => {
    const candidates = elements
      .filter((element): element is SVGElement => element instanceof SVGElement)
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          wireId: element.dataset['wireId'],
          point: [element.dataset['bendXU'], element.dataset['bendYU']],
        };
      });
    const visible = candidates.find((point) => {
      if (expected?.wireId !== undefined && point.wireId !== expected.wireId) {
        return false;
      }
      if (expected?.point !== undefined && point.point.join(':') !== expected.point.join(':')) {
        return false;
      }
      if (point.x <= 850 || point.x >= 1300 || point.y <= 380 || point.y >= 700) {
        return false;
      }
      const top = document
        .elementFromPoint(point.x, point.y)
        ?.closest<SVGElement>('[data-wire-bend]');
      const hasHigherControl = document
        .elementsFromPoint(point.x, point.y)
        .some(
          (element) => element.closest('[data-pin], [data-wire-end], [data-encoder-id]') !== null,
        );
      return top?.dataset['wireId'] === point.wireId && !hasHigherControl;
    });
    if (visible === undefined) {
      throw new Error('Missing visible semantic corner');
    }
    return visible;
  }, reference ?? null);
}
async function keyOrigin(
  page: Page,
  expectedWorld: { readonly x: number; readonly y: number } | undefined,
) {
  return page
    .locator('[data-section-id] path')
    .first()
    .evaluate((element, expected) => {
      if (!(element instanceof SVGGraphicsElement)) {
        throw new Error('Missing SVG geometry');
      }
      const matrix = element.getScreenCTM();
      if (matrix === null) {
        throw new Error('Missing world matrix');
      }
      for (const y of expected === null ? [0.9, 0.8, 0.7, 0.6, 0.5] : [expected.y - 6]) {
        for (const x of expected === null ? [0.9, 0.8, 0.7, 0.6, 0.5] : [expected.x - 6]) {
          const world = { x: 6 + x, y: 6 + y };
          const screen = new DOMPoint(world.x, world.y).matrixTransform(matrix);
          const target = document.elementFromPoint(screen.x, screen.y);
          if (
            target?.closest<SVGElement>('[data-key-id]')?.dataset['keyId'] === 'k45' &&
            target.closest('[data-wire-bend], [data-section-id], [data-wire-end]') === null
          ) {
            return { x: screen.x, y: screen.y, world };
          }
        }
      }
      throw new Error('Key k45 has no available body target');
    }, expectedWorld ?? null);
}

async function gestureOrigin(
  page: Page,
  scenario: Scenario,
  reference: PairedReference | undefined,
) {
  if (scenario === 'corner') {
    return cornerOrigin(page, reference);
  }
  return scenario === 'pan'
    ? worldPoint(page, { x: 6.8, y: 6.8 })
    : keyOrigin(page, reference?.world);
}

type PairedReference = {
  readonly world: { readonly x: number; readonly y: number } | undefined;
  readonly wireId: string | undefined;
  readonly point: readonly string[] | undefined;
};
async function readPairedReference(scenario: Scenario): Promise<PairedReference | undefined> {
  const directory = process.env['SCHEMATIC_BASELINE_LATENCY'];
  if (directory === undefined) {
    return undefined;
  }
  const receipt: unknown = JSON.parse(await readFile(`${directory}/${scenario}.json`, 'utf8'));
  if (
    receipt === null ||
    typeof receipt !== 'object' ||
    !('origin' in receipt) ||
    receipt.origin === null ||
    typeof receipt.origin !== 'object'
  ) {
    throw new TypeError('Missing paired gesture origin');
  }
  const origin = receipt.origin;
  const rawWorld: unknown = Reflect.get(origin, 'world');
  const world =
    rawWorld !== null &&
    typeof rawWorld === 'object' &&
    'x' in rawWorld &&
    'y' in rawWorld &&
    typeof rawWorld.x === 'number' &&
    typeof rawWorld.y === 'number'
      ? { x: rawWorld.x, y: rawWorld.y }
      : undefined;
  const wireId: unknown = Reflect.get(origin, 'wireId');
  const rawPoint: unknown = Reflect.get(origin, 'point');
  const point = Array.isArray(rawPoint)
    ? rawPoint.map((value: unknown) => {
        if (typeof value !== 'string') {
          throw new TypeError('Invalid paired corner');
        }
        return value;
      })
    : undefined;
  return { world, wireId: typeof wireId === 'string' ? wireId : undefined, point };
}
