import { expect, test } from './test';
import { build } from 'vite';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

test.beforeAll(async () => {
  await build({
    configFile: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    resolve: { tsconfigPaths: true },
    build: {
      outDir: 'test-results/jointjs-host-bundle',
      emptyOutDir: false,
      lib: {
        entry: 'tests/e2e/fixtures/jointjs-host.ts',
        name: 'HostSpike',
        formats: ['iife'],
        fileName: () => 'host.js',
      },
    },
  });
  await build({
    configFile: false,
    plugins: [react(), tailwindcss()],
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    resolve: { tsconfigPaths: true },
    build: {
      outDir: 'test-results/jointjs-host-bundle',
      emptyOutDir: false,
      lib: {
        entry: 'tests/e2e/fixtures/jointjs-react-host.tsx',
        name: 'ReactHostSpike',
        formats: ['iife'],
        fileName: () => 'react-host.js',
        cssFileName: 'react-host',
      },
    },
  });
});

test('core host preserves exact points and disposes/remounts once @cross-browser', async ({
  page,
}) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  const remote: string[] = [];
  page.on('request', (request) => remote.push(request.url()));
  await page.setContent(
    '<button data-mount>Mount</button><button data-dispose>Dispose</button><div data-diagram-host></div>',
  );
  await page.addScriptTag({ path: path.resolve('test-results/jointjs-host-bundle/host.js') });
  const conductor = page.locator('[data-diagram-host] path[joint-selector="conductor"]');
  await expect(conductor).toHaveAttribute('d', 'M 1 2 L 3 2 L 3 4');
  const points = await conductor.evaluate((node) => {
    if (!(node instanceof SVGGraphicsElement)) {
      throw new Error('Missing SVG path');
    }
    const matrix = node.getScreenCTM();
    if (matrix === null) {
      throw new Error('Missing transform');
    }
    return [
      new DOMPoint(1, 2).matrixTransform(matrix),
      new DOMPoint(3, 4).matrixTransform(matrix),
    ].map((point) => ({ x: point.x, y: point.y }));
  });
  expect(points[1]?.x).toBeCloseTo((points[0]?.x ?? 0) + 96);
  expect(points[1]?.y).toBeCloseTo((points[0]?.y ?? 0) + 96);
  const wire = page.locator('[role="graphics-symbol"]');
  await wire.focus();
  await page.keyboard.press('ArrowRight');
  await expect(wire).toBeFocused();
  await page.getByRole('button', { name: 'Dispose' }).click();
  await page.getByRole('button', { name: 'Dispose' }).click();
  await expect(page.locator('[data-diagram-host] svg')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mount' }).click();
  await page.getByRole('button', { name: 'Mount' }).click();
  await expect(page.locator('[data-diagram-host] svg')).toHaveCount(1);
  await expect(conductor).toHaveCount(1);
  expect(remote).toEqual([]);
});

test('shared React host survives StrictMode, lost capture and workspace lifetime @cross-browser', async ({
  page,
}) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.route('**/jointjs-host-spike', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<button data-hide>Hide</button><button data-show>Show</button><output></output><div data-react-host style="height:400px;display:flex"></div>',
    }),
  );
  await page.goto('/jointjs-host-spike');
  await page.addStyleTag({ path: path.resolve('test-results/jointjs-host-bundle/react-host.css') });
  const before = await page.evaluate(() => localStorage.getItem('zmk-customizer:project'));
  await page.addScriptTag({ path: path.resolve('test-results/jointjs-host-bundle/react-host.js') });
  await expect(page.locator('.joint-paper svg')).toHaveCount(1);
  const canvas = page.getByRole('application', { name: 'Shared diagram surface' });
  const bounds = await canvas.boundingBox();
  if (bounds === null) {
    throw new Error('Missing shared surface bounds');
  }
  await page.mouse.move(bounds.x + 100, bounds.y + 100);
  await page.mouse.down();
  await expect(page.locator('output')).toHaveText('Draft active');
  await page.mouse.move(bounds.x + 105, bounds.y + 105);
  await page.keyboard.press('Escape');
  await page.mouse.move(bounds.x + 110, bounds.y + 110);
  await expect(page.locator('output')).toHaveText('Cancelled');
  await page.mouse.up();
  await expect(page.locator('output')).toHaveText('Cancelled');
  await page.screenshot({ path: test.info().outputPath('shared-host.png') });
  await page.getByRole('button', { name: 'Hide' }).click();
  await expect(page.locator('.joint-paper')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show' }).click();
  await expect(page.locator('.joint-paper svg')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('zmk-customizer:project'))).toBe(before);
});
