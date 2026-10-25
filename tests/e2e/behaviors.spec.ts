import { parseProjectFile } from '@storage/project';
import { getResultValue } from '../helpers/result';
import { expect, test } from './test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { downloadJson, downloadZip, history, openProject, saved, workspace } from './helpers';

test('custom behaviors share definitions, persist and recover deletion @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Bindings');
  await page.getByText('Custom behaviors', { exact: true }).press('Enter');
  await page.getByRole('textbox', { name: 'New behavior name' }).fill('Home');
  await page.getByRole('button', { name: 'Create behavior', exact: true }).press('Enter');
  await page.getByText('Home', { exact: true }).press('Enter');
  const timing = page.getByRole('spinbutton', { name: 'Tapping term (ms)' });
  await timing.fill('250');
  await timing.press('Enter');
  await page
    .locator('summary')
    .filter({ hasText: /^Keys$/u })
    .click();
  await page.getByRole('checkbox', { name: 'Select key 0', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Select key 1', exact: true }).check();
  await page.getByRole('button', { name: /^behavior:/u }).click();
  await page.getByRole('searchbox', { name: 'Search by name, code or symbol' }).fill('Home');
  await page.getByRole('button', { name: 'Home', exact: true }).press('Enter');
  const reference = {
    kind: 'custom',
    behaviorId: 'b0',
    parameters: [
      { kind: 'key', key: { keycode: 'LSHIFT', modifiers: [] } },
      { kind: 'key', key: { keycode: 'A', modifiers: [] } },
    ],
  };
  await expect.poll(async () => (await saved(page)).layers[0]?.bindings['k0']).toEqual(reference);
  expect((await saved(page)).layers[0]?.bindings['k1']).toEqual(reference);
  await expect(page.getByRole('cell', { name: 'Home', exact: true })).toHaveCount(2);
  const json = getResultValue(parseProjectFile(await downloadJson(page)));
  expect(json.behaviors[0]).toMatchObject({
    id: 'b0',
    name: 'Home',
    kind: 'hold-tap',
    tappingTermMs: 250,
  });
  await page.reload();
  await workspace(page, 'Bindings');
  await page.getByText('Custom behaviors', { exact: true }).click();
  await page
    .locator('summary')
    .filter({ hasText: /^Home$/u })
    .click();
  await expect(page.getByRole('spinbutton', { name: 'Tapping term (ms)' })).toHaveValue('250');
  await page.getByRole('button', { name: 'Delete behavior Home', exact: true }).click();
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(
    page.getByRole('button', { name: /Bindings: Key 0 on layer Base uses deleted behavior/u }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Bindings: Key 1 on layer Base uses deleted behavior/u }),
  ).toBeVisible();
  await history(page, 'Undo').click();
  const files = await downloadZip(page);
  expect(files['config/unibody_six.keymap']).toContain('tapping-term-ms = <250>;');
  expect(files['config/unibody_six.keymap']?.match(/&user_home_b0 LSHIFT A/gu)).toHaveLength(2);
});

test('all custom behavior types have editable options and real exported nodes', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Bindings');
  await page.getByText('Custom behaviors', { exact: true }).click();
  for (const [kind, name] of [
    ['tap-dance', 'Dance'],
    ['mod-morph', 'Morph'],
    ['sticky-key', 'Sticky key tuned'],
    ['sticky-layer', 'Sticky layer tuned'],
  ] as const) {
    await page.getByRole('combobox', { name: 'Behavior type' }).selectOption(kind);
    await page.getByRole('textbox', { name: 'New behavior name' }).fill(name);
    await page.getByRole('button', { name: 'Create behavior', exact: true }).click();
  }
  await page
    .locator('summary')
    .filter({ hasText: /^Sticky layer tuned$/u })
    .click();
  const timeout = page.getByRole('spinbutton', { name: 'Release timeout (ms)' });
  await timeout.fill('1200');
  await timeout.press('Enter');
  await page.getByRole('checkbox', { name: 'Lazy', exact: true }).check();
  expect((await saved(page)).behaviors[3]).toMatchObject({ releaseAfterMs: 1200, lazy: true });
  const files = await downloadZip(page);
  const keymap = files['config/unibody_six.keymap'];
  expect(keymap).toContain('user_dance_b0:');
  expect(keymap).toContain('user_morph_b1:');
  expect(keymap).toContain('user_sticky_key_tuned_b2:');
  expect(keymap).toContain('user_sticky_layer_tun_b3:');
  expect(keymap).toContain('release-after-ms = <1200>;');
  expect(keymap).toContain('lazy;');
});
