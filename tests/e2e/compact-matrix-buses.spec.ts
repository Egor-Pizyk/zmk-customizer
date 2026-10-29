import { expect, test } from './test';
import type { Locator } from '@playwright/test';
import { buildProject } from '../helpers/build-project';
import {
  downloadJson,
  center,
  downloadZip,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';
import { getNets } from '@domain/wires/nets';
import type { Project } from '@domain';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`new 3x3 matrix uses compact buses, correct diodes and insulated crossings ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    const source = grid();
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Routing style', exact: true })).toHaveValue(
      'symmetric-bus',
    );
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
    await expect(apply).toBeEnabled();
    expect(await saved(page)).toEqual(source);
    await expect(page.locator('.joint-paper g[data-key-id][data-pin]:has(> text)')).toHaveCount(18);
    await page.screenshot({ path: test.info().outputPath(`compact-buses-${colorScheme}.png`) });
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await saved(page)).toEqual(source);
    await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
    await expect(apply).toBeEnabled();
    await apply.click();
    const accepted = await saved(page);
    await expect(page.getByRole('button', { name: 'Problems (0)', exact: true })).toBeVisible();
    await expect(page.locator('.joint-paper g[data-key-id][data-pin]:has(> text)')).toHaveCount(18);
    await page.getByRole('button', { name: 'Center keyboard', exact: true }).click();
    for (let step = 0; step < 4; step += 1) {
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    }
    const rowPort = await center(
      page.locator(
        `.joint-paper [data-wire-id="${rowRootId(accepted)}"][data-wire-end="start"] > path`,
      ),
    );
    expect(await bottom(page.getByText('R0 D0', { exact: true }))).toBeLessThan(rowPort.y);
    await page.screenshot({ path: test.info().outputPath(`accepted-buses-${colorScheme}.png`) });
    expect(accepted.wires).toHaveLength(15);
    expect(
      getNets(accepted)
        .map((net) => net.pins.length)
        .toSorted((first, second) => first - second),
    ).toEqual([3, 3, 3, 3, 3, 3]);
    expect(accepted.insulatedCrossings.length).toBeGreaterThan(0);
    for (const key of accepted.keys) {
      expect(key.diode).toEqual({ pin: 1, cathode: 'away-switch' });
    }
    expect(ports(accepted, 'row')).toEqual([
      { xU: -2.5, yU: 0 },
      { xU: -2.5, yU: 1 },
      { xU: -2.5, yU: 2 },
    ]);
    expect(ports(accepted, 'col')).toEqual([
      { xU: 0.6333, yU: -0.5 },
      { xU: 1.6333, yU: -0.5 },
      { xU: 2.6333, yU: -0.5 },
    ]);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(accepted);
    const json = await downloadJson(page);
    await importText(page, json);
    expect(await saved(page)).toEqual(accepted);
    const files = await downloadZip(page);
    await workspace(page, 'Schematic');
    await page.getByText('Wiring', { exact: true }).click();
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
    await expect(apply).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    expect(await downloadZip(page)).toEqual(files);
  });
}

function grid(): Project {
  const keys = Array.from({ length: 9 }, (_, i) => ({
    id: `k${i}`,
    xU: i % 3,
    yU: Math.floor(i / 3),
  }));
  const bindings = Object.fromEntries(
    keys.map((key) => [key.id, { kind: 'kp', key: { keycode: 'A', modifiers: [] } } as const]),
  );
  return { ...buildProject({ keys, bindings }), name: 'Compact grid', shieldName: 'compact_grid' };
}

async function bottom(locator: Locator): Promise<number> {
  const bounds = await locator.boundingBox();
  if (bounds === null) {
    throw new Error('Expected a visible terminal label.');
  }
  return bounds.y + bounds.height;
}
function rowRootId(project: Project): string {
  const terminal = project.wiring?.terminals.find((item) => item.kind === 'row');
  const wire = project.wires.find(
    (item) => item.start.kind === 'free' && item.start.terminalId === terminal?.id,
  );
  if (wire === undefined) {
    throw new Error('Expected a row terminal conductor.');
  }
  return wire.id;
}
function ports(project: Project, kind: 'row' | 'col') {
  const ids =
    project.wiring?.terminals
      .filter((terminal) => terminal.kind === kind)
      .map((terminal) => terminal.id) ?? [];
  return project.wires.flatMap((wire) =>
    wire.start.kind === 'free' && ids.includes(wire.start.terminalId ?? '') ? [wire.start.at] : [],
  );
}
