import { expect, test } from './test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { parseProjectFile } from '@storage/project';
import { getResultValue } from '../helpers/result';
import { downloadJson, downloadZip, history, openProject, saved, workspace } from './helpers';

const layered = {
  ...UNIBODY_PRESET,
  layers: [
    ...UNIBODY_PRESET.layers,
    { id: 'l2', name: 'Lower', bindings: {} },
    { id: 'l3', name: 'Adjust', bindings: {} },
  ],
};

test('create macro/combo/conditional rule, assign and download real advanced keymap @cross-browser', async ({
  page,
}) => {
  await openProject(page, layered);
  await workspace(page, 'Bindings');
  await page
    .locator('summary')
    .filter({ hasText: /^Combos, macros and conditional layers$/u })
    .press('Enter');
  await page.getByRole('textbox', { name: 'New macro name' }).fill('Sequence');
  await page.getByRole('button', { name: 'Create macro', exact: true }).press('Enter');
  await page
    .locator('summary')
    .filter({ hasText: /^Macro: Sequence$/u })
    .press('Enter');
  await page.getByRole('combobox', { name: 'Step 1 kind' }).selectOption('press');
  await page
    .getByRole('combobox', { name: 'Step 1 action key', exact: true })
    .selectOption('LEFT_SHIFT');
  await page.getByRole('button', { name: 'Add action step', exact: true }).click();
  await page.getByRole('combobox', { name: 'Step 2 action key', exact: true }).selectOption('B');
  await page.getByRole('button', { name: 'Add pause', exact: true }).click();
  const pause = page.getByRole('spinbutton', { name: 'Pause duration (ms)' });
  await pause.fill('120');
  await pause.press('Enter');
  await page.getByRole('button', { name: 'Add action step', exact: true }).click();
  await page.getByRole('combobox', { name: 'Step 4 kind' }).selectOption('release');
  await page
    .getByRole('combobox', { name: 'Step 4 action key', exact: true })
    .selectOption('LEFT_SHIFT');
  await page.getByRole('button', { name: 'Move step 3 up', exact: true }).click();
  await page.getByRole('button', { name: 'Move step 2 down', exact: true }).click();
  expect((await saved(page)).macros[0]?.steps.map((step) => step.kind)).toEqual([
    'press',
    'tap',
    'wait',
    'release',
  ]);
  await page
    .locator('summary')
    .filter({ hasText: /^Macro: Sequence$/u })
    .click();
  await page.getByRole('textbox', { name: 'New combo name' }).fill('Escape');
  await page.getByRole('button', { name: 'Create combo', exact: true }).click();
  await page
    .locator('summary')
    .filter({ hasText: /^Combo: Escape$/u })
    .click();
  await page.getByRole('checkbox', { name: 'Combo key 0', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Combo key 1', exact: true }).check();
  await page.getByRole('combobox', { name: 'Combo action behavior' }).selectOption('m1');
  await page.getByRole('checkbox', { name: 'Combo layers: Fn', exact: true }).check();
  await page.getByRole('button', { name: 'Create conditional rule', exact: true }).click();
  await page
    .locator('summary')
    .filter({ hasText: /^Conditional rule q1$/u })
    .click();
  await page.getByRole('checkbox', { name: 'Input layers: Base', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Input layers: Lower', exact: true }).check();
  await page.getByRole('combobox', { name: 'Target layer' }).selectOption('l3');
  await page
    .locator('summary')
    .filter({ hasText: /^Keys$/u })
    .click();
  await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).check();
  await page.getByRole('button', { name: /^behavior:/u }).click();
  await page.getByRole('searchbox', { name: 'Search by name, code or symbol' }).fill('Sequence');
  await page.getByRole('button', { name: 'Sequence', exact: true }).press('Enter');
  await expect(page.getByRole('cell', { name: 'Sequence', exact: true })).toBeVisible();
  const before = await saved(page);
  expect(before.layers[0]?.bindings['k0']).toEqual({ kind: 'macro', macroId: 'm1' });
  expect(before.combos[0]).toMatchObject({
    keyIds: ['k0', 'k1'],
    binding: { kind: 'macro', macroId: 'm1' },
    layerIds: ['l1'],
  });
  expect(before.conditionalLayers[0]).toEqual({
    id: 'q1',
    ifLayerIds: ['l1', 'l2'],
    thenLayerId: 'l3',
  });
  expect(getResultValue(parseProjectFile(await downloadJson(page)))).toEqual(before);
  const files = await downloadZip(page);
  const output = files['config/unibody_six.keymap'];
  expect(output).toContain('key-positions = <0 1>;');
  expect(output).toContain('<&macro_wait_time 120 &macro_press &none &macro_wait_time 15>');
  expect(output).toContain('if-layers = <1 2>;');
  expect(output).toContain('then-layer = <3>;');
  expect(output?.match(/&user_macro_sequence_m1/gu)).toHaveLength(2);
  await page.reload();
  expect(await saved(page)).toEqual(before);
  await workspace(page, 'Bindings');
  await page
    .locator('summary')
    .filter({ hasText: /^Combos, macros and conditional layers$/u })
    .click();
  await page
    .locator('summary')
    .filter({ hasText: /^Macro: Sequence$/u })
    .click();
  await page.getByRole('button', { name: 'Delete macro Sequence', exact: true }).click();
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(
    page.getByRole('button', { name: /Bindings: Combo Escape uses deleted macro/u }),
  ).toBeVisible();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  expect((await downloadZip(page))['config/unibody_six.keymap']).toBe(output);
});

test('combo positions and conditional references follow source order, deletion and Undo @cross-browser', async ({
  page,
}) => {
  const project = {
    ...layered,
    keys: layered.keys,
    combos: [
      {
        id: 'c1',
        name: 'Escape',
        keyIds: ['k0', 'k1'],
        timeoutMs: 50,
        layerIds: [],
        binding: { kind: 'kp' as const, key: { keycode: 'ESC', modifiers: [] } },
      },
    ],
    conditionalLayers: [{ id: 'q1', ifLayerIds: ['l0', 'l1'], thenLayerId: 'l2' }],
  };
  await openProject(page, project);
  expect((await saved(page)).combos[0]?.keyIds).toEqual(['k0', 'k1']);
  expect((await downloadZip(page))['config/unibody_six.keymap']).toContain(
    'key-positions = <0 1>;',
  );
  await workspace(page, 'Schematic');
  const renumbered = await saved(page);
  await page.getByRole('button', { name: 'Delete key 0', exact: true }).click();
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.getByRole('button', { name: /Bindings: Combo Escape: a key was deleted/u }).click();
  await expect(page.getByRole('textbox', { name: 'Combo name', exact: true })).toBeFocused();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(renumbered);
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '1 Fn', exact: true }).click();
  await page.getByRole('button', { name: 'Move right', exact: true }).click();
  await workspace(page, 'Export');
  await expect(
    page.getByRole('button', { name: /Conditional rule q1: place the target layer above/u }),
  ).toBeVisible();
  await history(page, 'Undo').click();
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '1 Fn', exact: true }).click();
  await page.getByRole('button', { name: 'Delete layer', exact: true }).click();
  await workspace(page, 'Export');
  await page
    .getByRole('button', { name: /Conditional rule q1: a referenced layer was deleted/u })
    .click();
  await expect(page.getByRole('combobox', { name: 'Target layer' })).toBeFocused();
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(renumbered);
  expect((await downloadZip(page))['config/unibody_six.keymap']).toContain('then-layer = <2>;');
});
