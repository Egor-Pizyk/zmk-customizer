import { visibleSection } from './wiring-preview-helpers';
import type { Project } from '@domain';
import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { buildProject } from '../helpers/build-project';
import {
  center,
  downloadJson,
  downloadZip,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';
import { findWireContacts } from '@domain/wires/contacts';
import { getNets } from '@domain/wires/nets';
import { getRoutingSettings } from '@domain/wiring';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Direct draws separate local input and ground leads ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    const source = grid();
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.context().setOffline(true);
    await expect(page.getByRole('combobox', { name: 'Routing style', exact: true })).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption('direct');
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
    await expect(apply).toBeEnabled();
    expect(await saved(page)).toEqual(source);
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await saved(page)).toEqual(source);
    await expect(history(page, 'Undo')).toBeDisabled();
    await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption('direct');
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    await expect(apply).toBeEnabled();
    await apply.click();
    const accepted = await saved(page);
    expect(accepted.routing?.matrixStyle).toBe('symmetric-bus');
    expect(accepted.wires).toHaveLength(18);
    expect(findWireContacts(accepted).overlaps).toEqual([]);
    expect(new Set(accepted.wires.map((wire) => JSON.stringify(wire.end))).size).toBe(18);
    expect(
      getNets(accepted)
        .map((net) => net.pins.length)
        .toSorted((first, second) => first - second),
    ).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 9]);
    await expect(page.locator('svg text').filter({ hasText: /^GND$/u })).toHaveCount(9);
    await expect(page.locator('svg text').filter({ hasText: /^D0$/u })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Problems (0)', exact: true })).toBeVisible();
    expect(await labelsCoverPins(page)).toBe(false);
    for (const wire of accepted.wires) {
      const point = await visibleSection(
        page.locator(`[data-section-id^="${wire.id}:"] path[pointer-events="none"]`),
      );
      await page.mouse.click(point.x, point.y);
      await expect(
        page.locator(`[data-section-id^="${wire.id}:"] path[data-selected]`),
      ).toHaveCount(1);
      expect(await saved(page)).toEqual(accepted);
      await page.keyboard.press('Escape');
    }
    const first = firstWireId(accepted);
    const point = await visibleSection(
      page.locator(`[data-section-id^="${first}:"] path[pointer-events="none"]`),
    );
    await page.mouse.click(point.x, point.y);
    const marker = page
      .locator(`[data-wire-bend][data-wire-id="${first}"] > rect[pointer-events="none"]`)
      .first();
    const bend = await center(marker);
    await page.mouse.click(bend.x, bend.y);
    expect(await saved(page)).toEqual(accepted);
    await page.keyboard.press('Escape');

    for (let step = 0; step < 4; step += 1) {
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    }
    expect(await labelsCoverPins(page)).toBe(false);
    await page.screenshot({ path: test.info().outputPath(`direct-separated-${colorScheme}.png`) });
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await expect(history(page, 'Undo')).toBeDisabled();
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(accepted);
    const json = await downloadJson(page);
    await importText(page, json);
    expect(await saved(page)).toEqual(accepted);
    const files = await downloadZip(page);
    const overlay = files['boards/shields/direct_grid/direct_grid.overlay'];
    expect(overlay).toContain('compatible = "zmk,kscan-gpio-direct";');
    expect(overlay?.match(/GPIO_ACTIVE_LOW \| GPIO_PULL_UP/gu)).toHaveLength(9);
    expect(overlay).toContain('RC(0,8)');
    await workspace(page, 'Schematic');
    await page.getByText('Wiring', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption('matrix');
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeEnabled();
    await expect(page.locator('svg text').filter({ hasText: /^R0 unassigned$/u })).toHaveCount(1);
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeEnabled();
    await expect(page.locator('svg text').filter({ hasText: /^R0 D\d+$/u })).toHaveCount(1);
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await saved(page)).toEqual(accepted);
  });
}
function grid() {
  const keys = Array.from({ length: 9 }, (_, index) => ({
    id: `k${index}`,
    xU: index % 3,
    yU: Math.floor(index / 3),
  }));
  const bindings = Object.fromEntries(
    keys.map((key) => [key.id, { kind: 'kp', key: { keycode: 'A', modifiers: [] } } as const]),
  );
  const source = {
    ...buildProject({ keys, bindings }),
    name: 'Direct grid',
    shieldName: 'direct_grid',
  };
  return {
    ...source,
    routing: { ...getRoutingSettings(source), matrixStyle: 'existing' as const },
  };
}

async function labelsCoverPins(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll('svg text')]
      .filter((element) => /^(?:D\d+|GND)$/u.test(element.textContent))
      .map((element) => element.getBoundingClientRect());
    const pins = [
      ...document.querySelectorAll(
        'g[data-key-id][data-pin]:has(> text) > circle:not([stroke-width="0"]), g[data-key-id][data-pin]:has(> text) > text',
      ),
    ].map((element) => element.getBoundingClientRect());
    return labels.some((label) =>
      pins.some(
        (pin) =>
          label.left < pin.right &&
          label.right > pin.left &&
          label.top < pin.bottom &&
          label.bottom > pin.top,
      ),
    );
  });
}

function firstWireId(project: Project): string {
  const wire = project.wires[0];
  if (wire === undefined) {
    throw new Error('Expected generated Direct input lead.');
  }
  return wire.id;
}
