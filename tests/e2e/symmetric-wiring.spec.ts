import { visibleSection } from './wiring-preview-helpers';
import { expect, test } from './test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { getWiringCells } from '@domain/wiring/matrix';
import type { Key, Project } from '@domain';
import {
  downloadJson,
  downloadZip,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`empty matrix bus preview, Cancel and atomic Apply ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    const source = emptySource();
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.screenshot({ path: test.info().outputPath('before-generation.png') });
    await expect(page.getByRole('combobox', { name: 'Routing style', exact: true })).toHaveCount(0);
    expect(await saved(page)).toEqual(source);
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
    await expect(apply).toBeEnabled();
    const conductor = await visibleSection(
      page.locator('[data-section-id] path[pointer-events="none"]'),
    );
    await page.mouse.click(conductor.x, conductor.y);
    await expect(
      page.locator(`[data-section-id="${conductor.id}"] path[data-selected]`),
    ).toHaveCount(1);
    expect(await saved(page)).toEqual(source);
    await page.screenshot({ path: test.info().outputPath('symmetric-bus-preview.png') });
    expect(await saved(page)).toEqual(source);
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    await expect(history(page, 'Undo')).toBeDisabled();
    expect(await saved(page)).toEqual(source);
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    await expect(apply).toBeEnabled();
    await apply.click();
    const accepted = await saved(page);
    expect(accepted.routing?.matrixStyle).toBe('symmetric-bus');
    expect(getWiringCells(accepted).map(({ row, col }) => [row, col])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
    expect(accepted.wires.filter((wire) => wire.end.kind === 'junction')).toHaveLength(6);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(accepted);
  });
}

test('matrix bus regeneration retains configured scan output and exact Save/Open state', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  const originalFiles = await downloadZip(page);
  await workspace(page, 'Schematic');
  await page.getByText('Wiring', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Routing style', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const accepted = await saved(page);
  expect(accepted.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([2, 6, 8, 9, 10]);
  const json = await downloadJson(page);
  await importText(page, json);
  expect(await saved(page)).toEqual(accepted);
  expect(await downloadZip(page)).toEqual(originalFiles);
});

function emptySource(): Project {
  const original: Project = UNIBODY_PRESET;
  const { wiring: _wiring, ...source } = original;
  return { ...source, keys: source.keys.map(withoutDiode), wires: [], insulatedCrossings: [] };
}
function withoutDiode(key: Key): Key {
  const { diode: _diode, ...rest } = key;
  return rest;
}

test('generation options and fixed preview actions fit a narrow workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const source = emptySource();
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Routing style', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate wiring', exact: true })).toBeInViewport({
    ratio: 1,
  });
  await expect(page.getByRole('button', { name: 'Prettify', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rebuild wiring', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Routing offset (u)', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Routing', exact: true })).toHaveCount(0);
  await expect(
    page
      .getByRole('group', { name: 'Wiring actions', exact: true })
      .getByRole('button', { name: 'Generate wiring', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Manual assignments', { exact: true }).locator('..'),
  ).not.toHaveAttribute('open');
  await page.screenshot({ path: test.info().outputPath('compact-wiring.png') });
  expect(await saved(page)).toEqual(source);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled();
  await expect(apply).toBeInViewport({ ratio: 1 });
  await expect(
    page.getByText('Generate Symmetric matrix buses · Whole schematic', { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('narrow-bus-preview.png') });
  await apply.click();
  expect((await saved(page)).routing?.offsetU).toBe(0.15);
});
