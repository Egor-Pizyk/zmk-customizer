import { DIAGRAM_SCENARIOS, startDiagramGesture } from './fixtures/diagram-gesture-target';
import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { measureDiagramTimings, median, readTimingSeries } from './fixtures/diagram-timings';
import { recordDiagramLatency, moveDiagramPointer, percentile95 } from './fixtures/diagram-latency';
import { importText, saved, workspace } from './helpers';
import type { Page } from '@playwright/test';

type Scenario = (typeof DIAGRAM_SCENARIOS)[number];
// preloadLarge owns onboarding setup; avoid unrelated editor fixture hooks.
const fixturePath = 'tests/fixtures/schematic/large.json';

// Playwright DOM snapshots execute on the app thread and distort the long-task gate.
// Keep CPU profiling separate; raw latency receipts and failure screenshots remain.
test.use({ trace: 'off' });

for (const scenario of DIAGRAM_SCENARIOS) {
  test(`large schematic native ${scenario} scheduling and long tasks`, async ({
    page,
    browser,
  }, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await preloadLarge(page);
    const before = await saved(page);
    for (let step = 0; step < 6; step += 1) {
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    }
    const origin = await startDiagramGesture(page, scenario);
    if (scenario === 'single-key' || scenario === 'multi-key') {
      await expect(
        page.locator(
          '.joint-paper [data-key-focus-id="k45"][data-selected], svg [data-key-focus-id="k45"][data-selected]',
        ),
      ).toHaveCount(1);
    }
    if (scenario === 'corner') {
      if (!('wireId' in origin) || typeof origin.wireId !== 'string') {
        throw new TypeError('Missing semantic corner wire');
      }
      const sections = page.locator(`[data-section-id][data-wire-id="${origin.wireId}"]`);
      const count = await sections.count();
      expect(count).toBeGreaterThan(0);
      await expect(sections.locator('path[data-selected]')).toHaveCount(count);
    }
    const recorder = await recordDiagramLatency(page);
    await moveDiagramPointer(page, origin, 20);
    const profiler =
      process.env['SCHEMATIC_PROFILE'] === 'true'
        ? await page.context().newCDPSession(page)
        : undefined;
    await profiler?.send('Profiler.enable');
    await profiler?.send('Profiler.start');
    const sampleCount = profiler === undefined ? 100 : 20;
    await recorder.evaluate((recording) => {
      recording.start();
    });
    await moveDiagramPointer(page, origin, sampleCount);
    const result = await recorder.evaluate((recording) => recording.finish());
    await recorder.dispose();
    if (profiler !== undefined) {
      const profile = await profiler.send('Profiler.stop');
      await writeFile(info.outputPath('diagnostic.cpuprofile'), JSON.stringify(profile.profile));
      await profiler.detach();
    }
    await page.keyboard.press('Escape');
    await page.mouse.up({ button: scenario === 'pan' ? 'middle' : 'left' });
    const receipt = {
      scenario,
      zoomInSteps: 6,
      origin,
      browser: browser.version(),
      node: process.version,
      image: process.env['SCHEMATIC_IMAGE_ID'],
      revision: process.env['SCHEMATIC_REVISION'],
      samples: result.samples,
      p95: percentile95(result.samples),
      tasks: result.tasks,
      window: [result.start, result.end],
    };
    const path = info.outputPath('latency.json');
    await writeFile(path, JSON.stringify(receipt, null, 2));
    await info.attach('native-latency', { path, contentType: 'application/json' });
    expect(result.samples).toHaveLength(sampleCount);
    expect(await saved(page)).toEqual(before);
    expect(result.tasks.filter((task) => task.duration > 200)).toEqual([]);
    await comparePairedLatency(scenario, receipt.p95, { origin, browser: browser.version() });
  });
}

async function preloadLarge(page: Page) {
  const raw = await readFile(fixturePath, 'utf8');
  await page.addInitScript((project) => {
    localStorage.setItem('zmk-customizer:project', project);
    localStorage.setItem('zmk-customizer:onboarding-shown', '{"version":1,"hasBeenShown":true}');
  }, raw);
  await page.goto('/');
  await expect(page.locator('[data-key-focus-id]')).toHaveCount(100);
}
async function comparePairedLatency(
  scenario: Scenario,
  p95: number,
  context: {
    readonly browser: string;
    readonly origin: { readonly x: number; readonly y: number };
  },
) {
  const directory = process.env['SCHEMATIC_BASELINE_LATENCY'];
  if (directory === undefined) {
    return;
  }
  const receipt: unknown = JSON.parse(await readFile(`${directory}/${scenario}.json`, 'utf8'));
  if (
    receipt === null ||
    typeof receipt !== 'object' ||
    !('p95' in receipt) ||
    typeof receipt.p95 !== 'number'
  ) {
    throw new Error('Invalid paired latency receipt');
  }
  expect(receipt).toHaveProperty('browser', context.browser);
  expect(receipt).toHaveProperty('node', process.version);
  expect(receipt).toHaveProperty('zoomInSteps', 6);
  if (process.env['SCHEMATIC_IMAGE_ID'] !== undefined) {
    expect(receipt).toHaveProperty('image', process.env['SCHEMATIC_IMAGE_ID']);
  }
  if (
    !('origin' in receipt) ||
    receipt.origin === null ||
    typeof receipt.origin !== 'object' ||
    !('x' in receipt.origin) ||
    typeof receipt.origin.x !== 'number' ||
    !('y' in receipt.origin) ||
    typeof receipt.origin.y !== 'number'
  ) {
    throw new TypeError('Invalid paired gesture origin');
  }
  expect(context.origin.x).toBeCloseTo(receipt.origin.x, 2);
  expect(context.origin.y).toBeCloseTo(receipt.origin.y, 2);
  if ('wireId' in receipt.origin) {
    expect(context.origin).toHaveProperty('wireId', receipt.origin.wireId);
  }
  if ('world' in receipt.origin) {
    expect(context.origin).toHaveProperty('world', receipt.origin.world);
  }
  expect(p95).toBeLessThanOrEqual(receipt.p95 * 1.25);
}

test('25 offline workspace/project/history cycles retain exactly one scene and one accepted command', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  await preloadLarge(page);
  const project = await saved(page);
  await context.setOffline(true);
  for (let cycle = 0; cycle < 25; cycle += 1) {
    await importText(page, JSON.stringify(project));
    await workspace(page, 'Bindings');
    await expect(page.locator('.joint-paper')).toHaveCount(0);
    await workspace(page, 'Schematic');
    await expect(page.locator('.joint-paper')).toHaveCount(
      process.env['SCHEMATIC_BASELINE_RUN'] === 'true' ? 0 : 1,
    );
    const key = page.locator('[data-key-focus-id="k1"]');
    await key.focus();
    await key.press('Shift+ArrowRight');
    expect((await saved(page)).keys[0]?.xU).toBe(0.25);
    await page.getByRole('banner').getByRole('button', { name: /^Undo/u }).click();
    expect(await saved(page)).toEqual(project);
  }
});

test('large schematic paired navigation and accepted nudge medians', async ({
  browser,
  baseURL,
}, info) => {
  test.setTimeout(60_000);
  if (baseURL === undefined) {
    throw new Error('Missing benchmark URL');
  }
  const result = await measureDiagramTimings(browser, baseURL, await readFile(fixturePath, 'utf8'));
  const path = info.outputPath('timings.json');
  await writeFile(
    path,
    JSON.stringify({ ...result, browser: browser.version(), node: process.version }, null, 2),
  );
  await info.attach('navigation-nudges', { path, contentType: 'application/json' });
  expect(result.loadToTwoFramesMs[0]).toBeLessThanOrEqual(2000);
  const baseline = process.env['SCHEMATIC_BASELINE_TIMINGS'];
  if (baseline === undefined) {
    return;
  }
  const receipt: unknown = JSON.parse(await readFile(baseline, 'utf8'));
  expect(receipt).toHaveProperty('browser', browser.version());
  expect(receipt).toHaveProperty('node', process.version);
  expect(median(result.loadToTwoFramesMs.slice(1))).toBeLessThanOrEqual(
    median(readTimingSeries(receipt, 'loadToTwoFramesMs').slice(1)) * 1.25,
  );
  expect(median(result.nudgeToTwoFrames.map((sample) => sample.ms))).toBeLessThanOrEqual(
    median(readTimingSeries(receipt, 'nudgeToTwoFrames')) * 1.25,
  );
});
