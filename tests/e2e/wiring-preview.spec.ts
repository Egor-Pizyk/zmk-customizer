import { expect, test } from './test';
import { readPaths, visibleSection } from './wiring-preview-helpers';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { buildProject } from '../helpers/build-project';
import { center, history, key, openProject, saved } from './helpers';

for (const action of ['Rebuild wiring']) {
  test(`${action} already draws the same fresh circuit before and after Apply`, async ({
    page,
  }, info) => {
    const source = buildProject({ keys: UNIBODY_PRESET.keys });
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.getByRole('button', { name: action, exact: true }).click();
    const paths = page.locator('[data-section-id] path[pointer-events="none"]');
    expect(await paths.count()).toBeGreaterThan(0);
    const proposal = await readPaths(paths);
    expect(proposal.every((path) => path !== null && !/NaN|Infinity/u.test(path))).toBe(true);
    for (const path of proposal) {
      const coordinates = path?.match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
      for (let index = 2; index < coordinates.length; index += 2) {
        expect(
          coordinates[index] === coordinates[index - 2] ||
            coordinates[index + 1] === coordinates[index - 1],
        ).toBe(true);
      }
    }
    expect(await saved(page)).toEqual(source);
    await page.screenshot({ path: info.outputPath('existing-route-preview.png') });
    await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
    expect(await readPaths(paths)).toEqual(proposal);
    const applied = await saved(page);
    expect(applied.keys).toEqual(source.keys);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(applied);
    await page.reload();
    expect(await readPaths(paths)).toEqual(proposal);
  });
}

test('wired Rebuild preview remains selectable and survives Select and editing-tool attempts @cross-browser', async ({
  page,
}, info) => {
  await openProject(page, UNIBODY_PRESET);
  await page.getByRole('radio', { name: 'Wire', exact: true }).press('Space');
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
  const paths = page.locator('[data-section-id] path[pointer-events="none"]');
  const proposal = await readPaths(paths);
  await page.screenshot({ path: info.outputPath('wired-rebuild-before-selection.png') });
  const point = await visibleSection(paths);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(`[data-section-id="${point.id}"] path[data-selected]`)).toHaveCount(1);
  await expect(page.getByRole('radio', { name: 'Select', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Select', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Wire', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
  await expect(
    page.getByText('Apply or cancel wiring before editing.', { exact: true }).first(),
  ).toBeVisible();
  expect(await readPaths(paths)).toEqual(proposal);
  const keyPoint = await center(key(page, 1));
  await page.mouse.move(keyPoint.x, keyPoint.y);
  await page.mouse.down();
  await page.mouse.move(keyPoint.x + 48, keyPoint.y, { steps: 4 });
  await page.mouse.up();
  await expect(key(page, 1)).toHaveAttribute('data-selected', 'true');
  await key(page, 1).focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Delete');
  await expect(key(page, 1)).toHaveAttribute('data-selected', 'true');
  await page.keyboard.press('v');
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
  expect(await readPaths(paths)).toEqual(proposal);
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  await page.screenshot({ path: info.outputPath('wired-rebuild-selected.png') });
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  expect(await readPaths(paths)).toEqual(proposal);
});
