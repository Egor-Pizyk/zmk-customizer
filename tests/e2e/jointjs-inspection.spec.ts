import { expect, test } from './test';
import {
  downloadZip,
  openProject,
  saved,
  wiredFixture,
  workspace,
  expectGeometry,
  importText,
} from './helpers';
import { readFile } from 'node:fs/promises';

for (const rotationDeg of [0, 45, 90]) {
  test(`projected inspection preserves ${rotationDeg} degree artwork and accepted data`, async ({
    page,
  }) => {
    const project = {
      ...wiredFixture,
      keys: wiredFixture.keys.map((key) => ({ ...key, rotationDeg })),
    };
    await openProject(page, project);
    await expect(page.locator('.joint-paper')).toHaveCount(1);
    const before = await saved(page);
    const first = before.keys[0];
    if (first === undefined) {
      throw new Error('Missing fixture key');
    }
    await expectGeometry(page, first);
    await workspace(page, 'Bindings');
    await workspace(page, 'Schematic');
    await expect(page.locator('.joint-paper')).toHaveCount(1);
    expect(await saved(page)).toEqual(before);
    await page.screenshot({ path: test.info().outputPath('inspection.png'), fullPage: true });
  });
}

test('unchanged accepted project downloads byte-identical baseline files', async ({ page }) => {
  await openProject(page, wiredFixture);
  const before = await saved(page);
  const expected: unknown = JSON.parse(
    await readFile('tests/fixtures/schematic/ordinary-generated.json', 'utf8'),
  );
  expect(await downloadZip(page)).toEqual(expected);
  expect(await saved(page)).toEqual(before);
});

test('empty, invalid and composite encoder projects retain inspection and repair', async ({
  page,
}) => {
  const empty = {
    ...wiredFixture,
    keys: [],
    wires: [],
    layers: wiredFixture.layers.map((layer) => ({ ...layer, bindings: {} })),
  };
  await page.goto('/');
  await importText(page, JSON.stringify(empty));
  await expect.poll(() => saved(page)).toEqual(empty);
  await expect(page.locator('.joint-paper')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Add key', exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(empty);
  const invalid = { ...wiredFixture, wires: [] };
  await openProject(page, invalid);
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await workspace(page, 'Schematic');
  expect(await saved(page)).toEqual(invalid);
  const encoder = {
    ...wiredFixture,
    encoders: [
      {
        id: 'e0',
        xU: 5,
        yU: 5,
        half: 'left' as const,
        steps: 20,
        triggersPerRotation: 80,
        wiringMode: 'schematic' as const,
        pushKeyId: 'k0',
      },
    ],
  };
  await openProject(page, encoder);
  await expect(
    page.locator('.joint-paper [role="graphics-symbol"][aria-label^="Encoder 0"]'),
  ).toHaveCount(1);
  await expect(page.locator('.joint-paper [data-key-focus-id="k0"]')).toHaveCount(0);
  await expect(page.locator('.joint-paper [data-encoder-pin="COM"]')).toHaveCount(1);
  expect(await saved(page)).toEqual(encoder);
  await page.screenshot({ path: test.info().outputPath('encoder.png'), fullPage: true });
});

test('legacy import stays repairable after projected navigation', async ({ page }) => {
  await page.goto('/');
  await importText(page, await readFile('tests/fixtures/project/v1.json', 'utf8'));
  await expect(page.locator('.joint-paper')).toHaveCount(1);
  const imported = await saved(page);
  expect(imported.schemaVersion).toBe(13);
  await workspace(page, 'Bindings');
  await workspace(page, 'Schematic');
  expect(await saved(page)).toEqual(imported);
});
