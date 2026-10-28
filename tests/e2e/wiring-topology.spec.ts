import { expect, test } from './test';
import type { Locator, Page } from '@playwright/test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { history, openProject, saved } from './helpers';

async function openWiring(page: Page) {
  await page.getByText('Wiring', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Scanning type', exact: true })).toBeVisible();
}

async function readWirePaths(paths: Locator) {
  return paths.evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('d') ?? '')
      .toSorted((first, second) => first.localeCompare(second)),
  );
}

for (const { mode, pinLabel } of [
  { mode: 'matrix', pinLabel: 'left col 2 pin' },
  { mode: 'direct', pinLabel: 'left input 5 pin' },
]) {
  test(`automatic ${mode} topology round trip redraws immediately with Wiring open @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: mode === 'matrix' ? 'light' : 'dark' });
    await openProject(page, UNIBODY_PRESET);
    await openWiring(page);
    await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption(mode);
    await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
    await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
    const before = await saved(page);
    const originalColumnPin = await page
      .getByRole('combobox', { name: pinLabel, exact: true })
      .inputValue();
    const paths = page.locator('[data-section-id] path[pointer-events="none"]');
    const unified = await readWirePaths(paths);
    const topology = page.getByRole('combobox', { name: 'Keyboard topology', exact: true });
    await topology.selectOption('split');
    await expect(page.getByRole('combobox', { name: 'Key 2 half', exact: true })).toHaveValue(
      'right',
    );
    await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
    await expect.poll(() => readWirePaths(paths)).not.toEqual(unified);
    await topology.selectOption('unibody');
    await expect(topology).toHaveValue('unibody');
    await expect(page.getByRole('combobox', { name: pinLabel, exact: true })).toHaveValue(
      originalColumnPin,
    );
    await expect.poll(() => readWirePaths(paths)).toEqual(unified);
    expect(await saved(page)).toEqual(before);
    await page.screenshot({ path: test.info().outputPath('topology-round-trip.png') });
    await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeDisabled();
    await topology.selectOption('split');
    await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
    const split = await saved(page);
    await topology.selectOption('unibody');
    await expect(page.getByRole('combobox', { name: 'Key 2 half', exact: true })).toHaveValue(
      'left',
    );
    await expect.poll(() => readWirePaths(paths)).toEqual(unified);
    expect(await saved(page)).toEqual(split);
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await saved(page)).toEqual(split);
    await topology.selectOption('unibody');
    await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
    const merged = await saved(page);
    expect(merged.wiring?.topology).toBe('unibody');
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(split);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(merged);
    await page.reload();
    expect(await saved(page)).toEqual(merged);
    await openWiring(page);
    await expect(topology).toHaveValue('unibody');
    await expect.poll(() => readWirePaths(paths)).toEqual(unified);
  });
}
