import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  downloadJson,
  downloadZip,
  editNumber,
  expectGeometry,
  history,
  importText,
  openProject,
  saved,
  wiredFixture,
  workspace,
} from './helpers';

async function assignSpace(page: Page) {
  const choose = page.getByRole('button', { name: 'Choose action for key 0', exact: true });
  if (!(await choose.isVisible())) {
    await page.getByRole('heading', { name: 'Keys', exact: true }).click();
  }
  await choose.click();
  const slot = page.getByRole('button', { name: /^key:/u });
  if (await slot.count()) {
    await slot.click();
  } else {
    await page.getByRole('button', { name: 'Key press', exact: true }).click();
    await page.getByRole('button', { name: /^key:/u }).click();
  }
  const search = page.getByRole('searchbox', {
    name: 'Search by name, code or symbol',
    exact: true,
  });
  await search.fill('SPACE');
  await search.press('Enter');
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
}

test('new project → layout → wiring → bindings → validated ZIP with matching geometry', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Start empty project', exact: true }).click();
  await page.getByRole('button', { name: 'Add key', exact: true }).click();
  await editNumber(page, 'Key 0 X (u)', '5');
  await editNumber(page, 'Key 0 Y (u)', '5');
  await expectGeometry(page, { id: 'k0', xU: 5, yU: 5, widthU: 1 });
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await expect(
    page.getByRole('paragraph').filter({ hasText: /Fix .* problems to download/u }),
  ).toBeVisible();
  await workspace(page, 'Schematic');
  const keyId = (await saved(page)).keys[0]?.id;
  if (keyId === undefined) {
    throw new Error('Missing created key');
  }
  const parts = page.getByRole('region', { name: 'Parts' });
  await parts.getByRole('button', { name: 'Add diode at key 0 pin 1', exact: true }).click();
  for (const pin of [1, 2]) {
    await page
      .getByRole('combobox', { name: 'From', exact: true })
      .selectOption(`pin:${keyId}:${pin}`);
    await page.getByRole('combobox', { name: 'To', exact: true }).selectOption('free');
    await page.getByRole('button', { name: 'Add wire', exact: true }).click();
  }
  await page.getByRole('combobox', { name: 'Wire 0 end board pin', exact: true }).selectOption('2');
  await page.getByRole('combobox', { name: 'Wire 1 end board pin', exact: true }).selectOption('8');
  await workspace(page, 'Bindings');
  await assignSpace(page);
  const result = await saved(page);
  expect(result.layers[0]?.bindings[keyId]).toEqual({
    kind: 'kp',
    key: { keycode: 'SPACE', modifiers: [] },
  });
  await expectGeometry(page, result.keys[0] ?? { id: keyId, xU: 5, yU: 5 });
  const zip = await downloadZip(page);
  expect(Object.keys(zip)).toContain('zephyr/module.yml');
  const overlay = Object.entries(zip).find(([name]) => name.endsWith('.overlay'))?.[1];
  expect(overlay).toContain('<&key_physical_attrs 100 100 500 500 0 0 0>');
  expect(overlay).toContain('diode-direction = "col2row"');
  expect(overlay).toContain('row-gpios = <&pro_micro 2 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>');
  expect(overlay).toContain('col-gpios = <&pro_micro 8 GPIO_ACTIVE_HIGH>');
  expect(Object.entries(zip).find(([name]) => name.endsWith('.keymap'))?.[1]).toContain(
    '&kp SPACE',
  );
  expect(JSON.parse(await downloadJson(page))).toEqual(result);
});

test('wiring problem blocks export and navigates to pin repair, Undo/Redo restore complete wiring', async ({
  page,
}) => {
  await openProject(page, wiredFixture);
  const before = await saved(page);
  await page.getByRole('combobox', { name: 'Wire 0 end board pin', exact: true }).selectOption('');
  const broken = await saved(page);
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  const problem = page.getByRole('button', { name: /Wire 0.*(assign|pin|GPIO)/iu }).first();
  await expect(problem).toBeVisible();
  await problem.click();
  await expect(page.getByRole('heading', { name: 'Schematic', level: 1 })).toBeVisible();
  const input = page.getByRole('combobox', { name: 'Wire 0 end board pin', exact: true });
  await expect(input).toBeFocused();
  await input.selectOption('2');
  expect(await saved(page)).toEqual(before);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(broken);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(before);
  expect((await downloadZip(page))['config/browser_shield.keymap']).toContain('&kp A');
});

test('bindings/layers survive switches and reload; downloaded JSON imports and invalid imports preserve project', async ({
  page,
}) => {
  await openProject(page, wiredFixture);
  await workspace(page, 'Bindings');
  const before = await saved(page);
  await page.getByRole('tab', { name: '1 Nav', exact: true }).click();
  await assignSpace(page);
  const bound = await saved(page);
  await history(page, 'Undo').click();
  await expect(page.getByRole('cell', { name: 'B', exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(bound);
  await page.getByRole('button', { name: 'Add layer', exact: true }).click();
  await expect(page.getByRole('tab', { name: /^2 /u })).toBeVisible();
  const result = await saved(page);
  await history(page, 'Undo').click();
  await expect(page.getByRole('tab', { name: /^2 /u })).toHaveCount(0);
  expect(await saved(page)).toEqual(bound);
  await history(page, 'Redo').click();
  await expect(page.getByRole('tab', { name: /^2 /u })).toBeVisible();
  expect(await saved(page)).toEqual(result);
  expect(result.layers[0]).toEqual(before.layers[0]);
  expect(result.layers[1]?.bindings['k0']).toEqual({
    kind: 'kp',
    key: { keycode: 'SPACE', modifiers: [] },
  });
  expect(result.layers).toHaveLength(3);
  await workspace(page, 'Schematic');
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '1 Nav', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
  const json = await downloadJson(page);
  expect(JSON.parse(json)).toEqual(result);
  await page.reload();
  expect(await saved(page)).toEqual(result);
  await page.getByRole('tab', { name: '1 Nav', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
  await importText(page, '{invalid-json');
  await expect(page.getByRole('alert')).toContainText(/JSON|file/iu);
  expect(await saved(page)).toEqual(result);
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
  await importText(page, JSON.stringify({ schemaVersion: 999 }));
  await expect(page.getByRole('alert')).toContainText(/newer version/iu);
  expect(await saved(page)).toEqual(result);
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Start empty project', exact: true }).click();
  expect((await saved(page)).keys).toHaveLength(0);
  await importText(page, json);
  await expect.poll(() => saved(page)).toEqual(result);
  await workspace(page, 'Schematic');
  await expectGeometry(page, result.keys[0] ?? { id: 'k0', xU: 5, yU: 5 });
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: '1 Nav', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Space', exact: true })).toBeVisible();
});

test('refused bend overflow keeps saved project and redo, then a repaired edit round trips', async ({
  page,
}) => {
  const project = {
    ...wiredFixture,
    wires: wiredFixture.wires.map((wire, index) =>
      index === 0
        ? { ...wire, bends: Array.from({ length: 64 }, () => ({ xU: 4, yU: 5.3667 })) }
        : wire,
    ),
  };
  await openProject(page, project);
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Renamed');
  await name.press('Enter');
  await history(page, 'Undo').click();
  await expect(history(page, 'Redo')).toBeEnabled();
  await page.getByRole('button', { name: 'Add a bend to wire 0', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('at most 64 bends');
  expect(await saved(page)).toEqual(project);
  await expect(history(page, 'Redo')).toBeEnabled();
  await page.getByRole('button', { name: 'Remove wire 0 bend 63', exact: true }).click();
  await expect.poll(async () => (await saved(page)).wires[0]?.bends.length).toBe(63);
  await page.getByRole('button', { name: 'Add a bend to wire 0', exact: true }).click();
  await expect.poll(async () => (await saved(page)).wires[0]?.bends.length).toBe(64);
  const expected = await saved(page);
  await importText(page, await downloadJson(page));
  await expect.poll(() => saved(page)).toEqual(expected);
});
