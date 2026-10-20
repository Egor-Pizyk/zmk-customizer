import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import {
  downloadJson,
  downloadZip,
  history,
  importText,
  key,
  openProject,
  saved,
  workspace,
} from './helpers';

const PRESETS = [
  {
    project: UNIBODY_PRESET,
    golden: 'tests/fixtures/generated/unibody/unibody_six.keymap',
  },
];

for (const { project, golden } of PRESETS) {
  test(`${project.name} survives no-edit keymap editor round trip @cross-browser`, async ({
    page,
  }) => {
    const expected = await readFile(golden, 'utf8');
    await openProject(page, project);
    await expect.poll(() => saved(page)).toEqual(project);
    await workspace(page, 'Bindings');
    await page
      .locator('summary')
      .filter({ hasText: /^Keys$/u })
      .press('Enter');
    for (const [layerIndex, layer] of project.layers.entries()) {
      const tab = page.getByRole('tab', {
        name: `${layerIndex} ${layer.name}${layerIndex === 0 ? ' always on' : ''}`,
        exact: true,
      });
      await tab.focus();
      await tab.press('Enter');
      await expect(
        page.getByRole('columnheader', { name: `Action (${layer.name})` }),
      ).toBeVisible();
      for (const keyIndex of project.keys.keys()) {
        const inspect = page.getByRole('button', {
          name: `Choose action for key ${keyIndex}`,
          exact: true,
        });
        await inspect.focus();
        await inspect.press('Enter');
        await expect(page.getByRole('complementary', { name: 'Action' })).toBeVisible();
        await expect(key(page, keyIndex)).toHaveAttribute(
          'aria-label',
          new RegExp(`^Key ${keyIndex}, ${layer.name} layer:`, 'u'),
        );
        await page
          .getByRole('searchbox', { name: 'Search by name, code or symbol' })
          .fill('no-match-keymap-014');
        await page.getByRole('searchbox').press('Escape');
        await expect(key(page, keyIndex)).toBeFocused();
      }
    }
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
    await expect(history(page, 'Redo')).toHaveAttribute('aria-disabled', 'true');
    expect(await saved(page)).toEqual(project);
    const json = await downloadJson(page);
    expect(JSON.parse(json)).toEqual(project);
    await page.reload();
    expect(await saved(page)).toEqual(project);
    await importText(page, json);
    expect(await saved(page)).toEqual(project);
    const files = await downloadZip(page);
    expect(files['config/unibody_six.keymap']).toBe(expected);
    expect(files['boards/shields/unibody_six/unibody_six.keymap']).toBe(expected);
  });
}

test('keyboard keycode discovery accepts name, alias and category @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Bindings');
  await page
    .locator('summary')
    .filter({ hasText: /^Keys$/u })
    .press('Enter');
  const inspect = page.getByRole('button', { name: 'Choose action for key 1', exact: true });
  await inspect.focus();
  await inspect.press('Enter');
  await page.getByRole('switch', { name: 'Next key after picking' }).press('Space');
  for (const { query, keycode } of [
    { query: 'backspace', keycode: 'BACKSPACE' },
    { query: 'ENTER', keycode: 'RETURN' },
    { query: 'letters', keycode: 'A' },
  ]) {
    const slot = page.getByRole('button', { name: /^key:/u });
    await slot.focus();
    await slot.press('Enter');
    const search = page.getByRole('searchbox', { name: 'Search by name, code or symbol' });
    await search.fill(query);
    await expect(page.getByText(/Nothing matches/u)).toHaveCount(0);
    await search.press('Enter');
    await expect(page.getByRole('button', { name: `key: ${keycode}`, exact: true })).toBeVisible();
    expect(await saved(page)).toEqual({
      ...UNIBODY_PRESET,
      layers: UNIBODY_PRESET.layers.map((layer, layerIndex) =>
        layerIndex === 0
          ? {
              ...layer,
              bindings: { ...layer.bindings, k1: { kind: 'kp', key: { keycode, modifiers: [] } } },
            }
          : layer,
      ),
    });
  }
  for (let count = 0; count < 3; count += 1) {
    await history(page, 'Undo').click();
  }
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
});

test('layer reorder and deletion preserve targets and restore golden output', async ({ page }) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '1 Fn', exact: true }).click();
  await page.getByRole('button', { name: 'Move left', exact: true }).click();
  const reordered = await saved(page);
  expect(reordered.layers).toEqual(UNIBODY_PRESET.layers.toReversed());
  const files = await downloadZip(page);
  expect(files['config/unibody_six.keymap']).toContain('&mo 0');
  expect(files['config/unibody_six.keymap']).toContain('&lt 0 SPACE');
  expect(files['config/unibody_six.keymap']).toContain('&to 1');
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '0 Fn always on', exact: true }).click();
  await page.getByRole('button', { name: 'Delete layer', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Bindings, 2 problems/u })).toBeVisible();
  await page.getByRole('button', { name: /^Problems \(2\)/u }).click();
  for (const keyIndex of [2, 5]) {
    await expect(
      page.getByRole('button', { name: new RegExp(`Key ${keyIndex}.*uses a deleted layer`, 'u') }),
    ).toBeVisible();
  }
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(reordered);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  const restored = await downloadZip(page);
  expect(restored['config/unibody_six.keymap']).toBe(
    await readFile('tests/fixtures/generated/unibody/unibody_six.keymap', 'utf8'),
  );
});
