import { expect, test } from './test';
import type { Locator } from '@playwright/test';
import { downloadJson, history, openProject, saved } from './helpers';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import type { Project } from '@domain';
import { parseProjectFile } from '@storage/project';

for (const width of [1024, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`matrix local routes and grouped outputs survive preview/history ${width}px ${colorScheme} @cross-browser`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      const original = { ...UNIBODY_PRESET, wires: [], insulatedCrossings: [] };
      await openProject(page, original);
      await page.getByText('Wiring', { exact: true }).click();
      await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
      await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
      expect(await saved(page)).toEqual(original);
      await page.getByRole('button', { name: 'Cancel wiring', exact: true }).press('Enter');
      expect(await saved(page)).toEqual(original);
      await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).press('Enter');
      await page.getByRole('button', { name: 'Apply wiring', exact: true }).press('Enter');
      const applied = await saved(page);
      expectStraightLocalWires(applied);
      const outputs = getOutputs(applied);
      expect(outputs).toHaveLength(applied.wiring?.terminals.length ?? 0);
      for (const kind of ['row', 'col']) {
        const ids = new Set(
          applied.wiring?.terminals
            .filter((terminal) => terminal.kind === kind)
            .map((terminal) => terminal.id),
        );
        expect(
          new Set(
            outputs
              .filter((end) => ids.has(end.terminalId))
              .map((end) => getFixedCoordinate(end.at, kind)),
          ).size,
        ).toBe(1);
        await expect(
          page.locator('svg text').filter({ hasText: new RegExp(`^left ${kind} `, 'u') }),
        ).toHaveCount(ids.size);
      }
      for (let step = 0; step < 3; step += 1) {
        await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Collapse Tools', exact: true }).press('Enter');
      for (const label of await page
        .locator('svg text')
        .filter({ hasText: /^left (row|col) /u })
        .all()) {
        await expectLabelInCanvas(label);
      }
      await page.screenshot({ path: test.info().outputPath('grouped-matrix.png') });
      await history(page, 'Undo').click();
      expect(await saved(page)).toEqual(original);
      await history(page, 'Redo').click();
      expect(await saved(page)).toEqual(applied);
      await page.reload();
      expect(await saved(page)).toEqual(applied);
      expect(parseProjectFile(await downloadJson(page))).toEqual({ ok: true, value: applied });
    });
  }
}

function getOutputs(project: Project) {
  return project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined
        ? [{ terminalId: end.terminalId, at: end.at }]
        : [],
    );
}

function getFixedCoordinate(at: { readonly xU: number; readonly yU: number }, kind: string) {
  return kind === 'row' ? at.yU : at.xU;
}

async function expectLabelInCanvas(label: Locator) {
  await expect(label).toBeVisible();
  const box = await label.boundingBox();
  const canvas = await label.locator('xpath=ancestor::*[local-name()="svg"]').boundingBox();
  if (box === null || canvas === null) {
    throw new Error('Missing rendered output label or canvas bounds');
  }
  expect(box.x).toBeGreaterThanOrEqual(canvas.x);
  expect(box.y).toBeGreaterThanOrEqual(canvas.y);
  expect(box.x + box.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height);
}

function expectStraightLocalWires(project: Project) {
  const local = project.wires.filter(
    (wire) => wire.start.kind === 'key-pin' && wire.end.kind === 'key-pin',
  );
  expect(local).toHaveLength(7);
  expect(local.map((wire) => wire.bends)).toEqual(Array.from({ length: 7 }, () => []));
}
