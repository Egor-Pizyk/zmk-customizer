import type { Browser, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { saved } from '../helpers';

export async function measureDiagramTimings(browser: Browser, baseURL: string, raw: string) {
  const loads: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.addInitScript((project) => {
      localStorage.setItem('zmk-customizer:project', project);
      localStorage.setItem('zmk-customizer:onboarding-shown', '{"version":1,"hasBeenShown":true}');
    }, raw);
    const started = performance.now();
    await page.goto(baseURL);
    await page.locator('[data-key-id="k1"]').first().waitFor();
    await secondFrame(page);
    loads.push(performance.now() - started);
    if (index === 3) {
      const nudges = await measureNudges(page);
      await context.close();
      return { loadToTwoFramesMs: loads, nudgeToTwoFrames: nudges };
    }
    await context.close();
  }
  throw new Error('Missing warm navigation');
}
async function measureNudges(page: Page) {
  await page.locator('[data-key-focus-id="k1"]').focus();
  const samples: {
    ms: number;
    beforeX: number | undefined;
    afterX: number | undefined;
    savedChanged: boolean;
  }[] = [];
  for (let index = 0; index < 5; index += 1) {
    const before = await saved(page);
    const started = performance.now();
    await page.keyboard.press(index % 2 === 0 ? 'Shift+ArrowRight' : 'Shift+ArrowLeft');
    await secondFrame(page);
    const ms = performance.now() - started;
    const after = await saved(page);
    expect(after.keys[0]?.xU).toBe(index % 2 === 0 ? 0.25 : 0);
    samples.push({
      ms,
      beforeX: before.keys[0]?.xU,
      afterX: after.keys[0]?.xU,
      savedChanged: JSON.stringify(before) !== JSON.stringify(after),
    });
  }
  return samples;
}
async function secondFrame(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );
}
export function median(samples: readonly number[]) {
  const value = samples.toSorted((first, second) => first - second)[Math.floor(samples.length / 2)];
  if (value === undefined) {
    throw new Error('Missing timing samples');
  }
  return value;
}
export function readTimingSeries(value: unknown, property: string): number[] {
  if (value === null || typeof value !== 'object') {
    throw new Error('Invalid timing receipt');
  }
  const series: unknown = Reflect.get(value, property);
  if (!Array.isArray(series)) {
    throw new TypeError('Missing timing series');
  }
  return series.map((entry: unknown) => {
    const number: unknown =
      typeof entry === 'object' && entry !== null ? Reflect.get(entry, 'ms') : entry;
    if (typeof number !== 'number') {
      throw new TypeError('Invalid timing sample');
    }
    return number;
  });
}
