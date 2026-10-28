import { expect, test } from './test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { buildProject } from '../helpers/build-project';
import { center, history, key, openProject, saved } from './helpers';
import { readPaths, visibleSection } from './wiring-preview-helpers';

for (const mode of ['matrix', 'direct']) {
  for (const action of ['Rebuild wiring']) {
    test(`fresh ${mode} ${action} keeps proposal feedback and selection until Apply or Cancel @cross-browser`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ colorScheme: mode === 'matrix' ? 'light' : 'dark' });
      const source = buildProject({ keys: UNIBODY_PRESET.keys });
      await openProject(page, source);
      await page.getByText('Wiring', { exact: true }).click();
      await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption(mode);
      await page.getByRole('button', { name: action, exact: true }).click();
      await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeEnabled();
      const paths = page.locator('[data-section-id] path[pointer-events="none"]');
      const proposal = await readPaths(paths);
      expect(proposal.length).toBeGreaterThan(0);
      await expect(
        page.locator('[data-pin] circle[vector-effect="non-scaling-stroke"]'),
      ).toHaveCount(0);
      const point = await visibleSection(paths);
      await page.mouse.click(point.x, point.y);
      await expect(page.locator(`[data-section-id="${point.id}"] path[data-selected]`)).toHaveCount(
        1,
      );
      const other = await visibleSection(
        page.locator(
          `[data-section-id]:not([data-section-id="${point.id}"]) path[pointer-events="none"]`,
        ),
      );
      await page.keyboard.down('Shift');
      await page.mouse.click(other.x, other.y);
      await page.keyboard.up('Shift');
      await expect(page.locator('[data-section-id] path[data-selected]')).toHaveCount(2);
      const at = await center(key(page, 2));
      await page.mouse.click(at.x, at.y);
      await expect(key(page, 2)).toHaveAttribute('data-selected', 'true');
      await page.getByRole('radio', { name: 'Select', exact: true }).press('Space');
      expect(await readPaths(paths)).toEqual(proposal);
      expect(await saved(page)).toEqual(source);
      await page.screenshot({ path: info.outputPath('fresh-inspectable-preview.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByText('Preview', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath('fresh-preview-narrow.png') });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
      const applied = await saved(page);
      expect(await readPaths(paths)).toEqual(proposal);
      await page.getByRole('radio', { name: 'Wire', exact: true }).press('Space');
      expect(await readPaths(paths)).toEqual(proposal);
      expect(await saved(page)).toEqual(applied);
      await history(page, 'Undo').click();
      expect(await saved(page)).toEqual(source);
      await history(page, 'Redo').click();
      expect(await saved(page)).toEqual(applied);
      await page.reload();
      expect(await readPaths(paths)).toEqual(proposal);
    });
  }
}

for (const action of ['Rebuild wiring']) {
  test(`no-wire project with existing assignments retains ${action} until explicit cancellation @cross-browser`, async ({
    page,
  }) => {
    const source = { ...UNIBODY_PRESET, wires: [], insulatedCrossings: [] };
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeEnabled();
    const paths = page.locator('[data-section-id] path[pointer-events="none"]');
    const proposal = await readPaths(paths);
    expect(proposal.length).toBeGreaterThan(0);
    await page.getByText('Inspect wire sections', { exact: true }).click();
    const choice = page.getByRole('checkbox', { name: /^Section 1,/u });
    await choice.press('Space');
    await expect(choice).toBeChecked();
    await choice.press('Delete');
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeVisible();
    expect(await readPaths(paths)).toEqual(proposal);
    expect(await saved(page)).toEqual(source);
    await choice.press('Escape');
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Wiring preview cancelled. Saved wiring restored.', { exact: true }),
    ).toBeVisible();
    await expect(paths).toHaveCount(0);
    expect(await saved(page)).toEqual(source);
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeEnabled();
    expect(await readPaths(paths)).toEqual(proposal);
    await page.getByText('Parts', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toHaveCount(0);
    await expect(paths).toHaveCount(0);
    expect(await saved(page)).toEqual(source);
  });
}

test('a stale no-wire proposal remains visible but cannot revive after an external edit and Undo @cross-browser', async ({
  page,
}) => {
  const source = buildProject({ keys: UNIBODY_PRESET.keys });
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Rebuild wiring', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled();
  const paths = page.locator('[data-section-id] path[pointer-events="none"]');
  const proposal = await readPaths(paths);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Edited after preview');
  await page.getByRole('textbox', { name: 'Name', exact: true }).press('Tab');
  await expect(apply).toBeDisabled();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(source);
  expect(await readPaths(paths)).toEqual(proposal);
  await expect(apply).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveText(
    'The project changed. Recalculate the wiring preview.',
  );
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  await expect(paths).toHaveCount(0);
});
