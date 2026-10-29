import { expect, test } from './test';
import { buildProject, freeEnd } from '../helpers/build-project';
import {
  downloadJson,
  downloadZip,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';
import { visibleSection } from './wiring-preview-helpers';
import { getElectricalRelations } from '@domain/wires/nets';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import type { Wire } from '@domain';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Prettify removes mutually obstructing detours atomically ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    const source = obstructingDetours();
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
    await expect(apply).toBeEnabled();
    expect(await saved(page)).toEqual(source);
    await visibleSection(page.locator('[data-section-id] path[pointer-events="none"]'));
    await page.screenshot({ path: test.info().outputPath(`straight-preview-${colorScheme}.png`) });
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await saved(page)).toEqual(source);
    await expect(history(page, 'Undo')).toBeDisabled();
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    await expect(apply).toBeEnabled();
    await apply.click();
    const accepted = await saved(page);
    expect(accepted.wires.map((wire) => wire.bends)).toEqual([[], []]);
    expect(accepted.insulatedCrossings).toEqual([{ wireIds: ['w0', 'w1'], ordinal: 0 }]);
    expect(getElectricalRelations(accepted)).toEqual(getElectricalRelations(source));
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await expect(history(page, 'Undo')).toBeDisabled();
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(accepted);
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
    await expect(apply).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    const json = await downloadJson(page);
    await importText(page, json);
    expect(await saved(page)).toEqual(accepted);
  });
}

test('simplifying an existing matrix preserves every downloaded ZMK file', async ({ page }) => {
  const source = { ...UNIBODY_PRESET, wires: UNIBODY_PRESET.wires.map(matrixDetour) };
  await openProject(page, source);
  const before = await downloadZip(page);
  await workspace(page, 'Schematic');
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Prettify', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled();
  expect(await saved(page)).toEqual(source);
  await apply.click();
  const accepted = await saved(page);
  expect(accepted.wires).not.toEqual(source.wires);
  expect(getElectricalRelations(accepted)).toEqual(getElectricalRelations(source));
  expect(await downloadZip(page)).toEqual(before);
});

function matrixDetour(wire: Wire): Wire {
  return wire.id === 'w0'
    ? {
        ...wire,
        bends: [
          { xU: 0.3, yU: -0.5 },
          { xU: -1, yU: -0.5 },
        ],
      }
    : wire;
}

function obstructingDetours() {
  return buildProject({
    keys: [{ id: 'k0', xU: 6, yU: 4 }],
    wires: [
      {
        id: 'w0',
        start: freeEnd(4, 4),
        end: freeEnd(8, 4),
        bends: [
          { xU: 4, yU: 6 },
          { xU: 8, yU: 6 },
        ],
      },
      {
        id: 'w1',
        start: freeEnd(6, 3),
        end: freeEnd(6, 5),
        bends: [
          { xU: 4.05, yU: 3 },
          { xU: 4.05, yU: 4.05 },
          { xU: 5, yU: 4.05 },
          { xU: 5, yU: 5 },
        ],
      },
    ],
  });
}
