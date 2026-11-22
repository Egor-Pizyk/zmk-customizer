import { expect, test } from './test';
import { readFile } from 'node:fs/promises';
import {
  downloadJson,
  downloadZip,
  openProject,
  saved,
  wiredFixture,
  workspace,
  key,
} from './helpers';

test('proposal inspection and native Save/ZIP use accepted data', async ({ page }) => {
  await openProject(page, wiredFixture);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete wiring', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-wire-bend]')).toHaveCount(0);
  await key(page).focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Delete');
  expect(await saved(page)).toEqual(wiredFixture);
  expect(JSON.parse(await downloadJson(page))).toEqual(wiredFixture);
  await expect(page.getByRole('button', { name: 'Cancel wiring', exact: true })).toBeVisible();
  const baseline: unknown = JSON.parse(
    await readFile('tests/fixtures/schematic/ordinary-generated.json', 'utf8'),
  );
  expect(await downloadZip(page)).toEqual(baseline);
  expect(await saved(page)).toEqual(wiredFixture);
});

test('supported renderer failure keeps Save working and Retry uses current accepted input @cross-browser', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('test:diagram-failure', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const original = svg.createSVGMatrix.bind(svg);
    SVGSVGElement.prototype.createSVGMatrix = () => {
      if (sessionStorage.getItem('test:diagram-failure') === 'true') {
        throw new DOMException('Injected SVG capability failure', 'NotSupportedError');
      }
      return original();
    };
  });
  await openProject(page, wiredFixture);
  const retry = page.getByRole('button', { name: 'Retry diagram', exact: true });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(retry).toBeVisible();
  expect(JSON.parse(await downloadJson(page))).toEqual(wiredFixture);
  const x = page.getByRole('spinbutton', { name: 'Key 0 X (u)', exact: true });
  await x.fill('0.25');
  await x.press('Enter');
  const accepted = await saved(page);
  expect(accepted.keys[0]?.xU).toBe(0.25);
  await page.evaluate(() => {
    sessionStorage.removeItem('test:diagram-failure');
  });
  await retry.click();
  await expect(retry).toHaveCount(0);
  await expect(page.locator('[data-canvas-workspace="schematic"]')).toBeFocused();
  await expect(page.locator('.joint-paper [data-key-focus-id="k0"]')).toHaveCount(1);
  expect(await saved(page)).toEqual(accepted);
  await page.getByRole('banner').getByRole('button', { name: /^Undo/u }).click();
  expect(await saved(page)).toEqual(wiredFixture);
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeEnabled();
});
