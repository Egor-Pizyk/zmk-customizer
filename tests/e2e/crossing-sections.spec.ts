import { expect, test } from './test';
import { fixture, history, openProject, saved } from './helpers';
import type { Locator } from '@playwright/test';
import type { Project } from '@domain';

for (const arm of ['horizontal', 'vertical'] as const) {
  test(`both sides of a connected L crossing select independently on its ${arm} arm @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: arm === 'vertical' ? 'dark' : 'light' });
    const project: Project = {
      ...fixture,
      keys: [
        { id: 'k0', xU: 5, yU: 8 },
        { id: 'k1', xU: 9, yU: 8 },
      ],
      layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      wires: [
        {
          id: 'w1',
          start: { kind: 'free', at: { xU: 5, yU: 5 } },
          end: { kind: 'free', at: { xU: 9, yU: 9 } },
          bends: [],
        },
        {
          id: 'w2',
          start: { kind: 'free', at: arm === 'horizontal' ? { xU: 7, yU: 3 } : { xU: 7, yU: 7 } },
          end: { kind: 'free', at: arm === 'horizontal' ? { xU: 7, yU: 7 } : { xU: 11, yU: 7 } },
          bends: [],
        },
      ],
      insulatedCrossings: [],
    };
    await openProject(page, project);
    for (const id of ['w1:0:0', 'w1:0:1']) {
      const point = await sectionPoint(
        page.locator(`[data-section-id="${id}"] path[pointer-events="stroke"]`),
      );
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(1);
      await expect(page.locator(`[data-section-id="${id}"] path[data-selected]`)).toHaveAttribute(
        'stroke-width',
        '3',
      );
      expect(await saved(page)).toEqual(project);
    }
    const first = await sectionPoint(
      page.locator('[data-section-id="w1:0:0"] path[pointer-events="stroke"]'),
    );
    await page.keyboard.down('Shift');
    await page.mouse.click(first.x, first.y);
    await page.keyboard.up('Shift');
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(2);
    await page.screenshot({ path: test.info().outputPath('both-crossing-sides.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(0);
    const checkboxes = page.getByRole('checkbox', { name: /^Section [12],/u });
    await checkboxes.nth(0).focus();
    await checkboxes.nth(0).press('Space');
    await checkboxes.nth(1).focus();
    await checkboxes.nth(1).press('Space');
    await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(2);
    await checkboxes.nth(1).press('Space');
    await page.getByRole('button', { name: 'Delete selected sections', exact: true }).click();
    const cut = await saved(page);
    expect(cut.wires).toHaveLength(2);
    expect(cut.wires.find((wire) => wire.id === 'w2')).toEqual(project.wires[1]);
    expect(cut.wires.find((wire) => wire.id !== 'w2')).toMatchObject({
      start: { kind: 'free', at: arm === 'horizontal' ? { xU: 7, yU: 5 } : { xU: 9, yU: 7 } },
      end: { kind: 'free', at: { xU: 9, yU: 9 } },
    });
    await history(page, 'Undo').click();
    await expect.poll(() => saved(page)).toEqual(project);
    const insulated = {
      ...project,
      insulatedCrossings: [{ wireIds: ['w1', 'w2'] as const, ordinal: 0 }],
    };
    await openProject(page, insulated);
    const continuous = page.locator(
      '[data-wire-id="w1"][data-section-id] path[pointer-events="stroke"]',
    );
    await expect(continuous).toHaveCount(1);
    for (const fraction of [0.2, 0.8]) {
      const point = await sectionPoint(continuous, { fraction });
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(1);
      await expect(page.locator('[data-section-id="w1:0:0"] path[data-selected]')).toBeVisible();
      expect(await saved(page)).toEqual(insulated);
    }
  });
}

async function sectionPoint(section: Locator, input?: { readonly fraction: number }) {
  return section.evaluate((element, fraction) => {
    if (!(element instanceof SVGPathElement)) {
      throw new Error('Missing conductor');
    }
    const matrix = element.getScreenCTM();
    if (matrix === null) {
      throw new Error('Missing transform');
    }
    const point = element
      .getPointAtLength(element.getTotalLength() * fraction)
      .matrixTransform(matrix);
    return { x: point.x, y: point.y };
  }, input?.fraction ?? 0.4);
}
