import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { getNets } from '@domain/wires/nets';
import { getWiringCells } from '@domain/wiring/matrix';
import { expect, test } from './test';

import {
  downloadJson,
  downloadZip,
  editNumber,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';
import type { Page } from '@playwright/test';

async function openWiring(page: Page) {
  await page.getByText('Wiring', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Scanning type', exact: true })).toBeVisible();
}
test('matrix preview, conflict repair, history and actual JSON/ZIP agree @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await openWiring(page);
  await page.getByRole('combobox', { name: 'left row 0 pin', exact: true }).selectOption('21');
  await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
  await expect(page.getByText('Calculating wiring…', { exact: true })).toHaveCount(0);
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'left row 0 pin', exact: true })).toHaveValue(
    '2',
  );
  await editNumber(page, 'Key 0 matrix row', '1');
  await expect(
    page.getByRole('button', { name: 'left row 1 col 0: Key 0, Key 3', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const conflict = await saved(page);
  expect(
    getNets(conflict).find((net) => net.pins.some((pin) => pin.keyId === 'k0' && pin.pin === 1))
      ?.pins,
  ).toContainEqual({ keyId: 'k3', pin: 1 });
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await workspace(page, 'Schematic');
  await openWiring(page);
  await editNumber(page, 'Key 0 matrix row', '0');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const repaired = await saved(page);
  expect(getWiringCells(repaired).map((cell) => [cell.row, cell.col])).toEqual([
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ]);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(conflict);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(repaired);
  const json = await downloadJson(page);
  await importText(page, json);
  expect(await saved(page)).toEqual(repaired);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('RC(0,0)');
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('RC(1,2)');
});
test('direct conversion shows ground, saves inputs and downloads active-low scan', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await openWiring(page);
  await page.getByRole('combobox', { name: 'Scanning type', exact: true }).selectOption('direct');
  await expect(page.getByText('GND — common switch ground', { exact: true }).first()).toBeVisible();
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  for (let index = 0; index < 6; index += 1) {
    await page
      .getByRole('combobox', { name: `left input ${index} pin`, exact: true })
      .selectOption(String(index));
  }
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const project = await saved(page);
  expect(project.keys.every((key) => key.diode === undefined)).toBe(true);
  expect(getNets(project).find((net) => net.pins.length === 6)?.terminalIds).toHaveLength(1);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    'compatible = "zmk,kscan-gpio-direct";',
  );
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    '<&pro_micro 5 (GPIO_ACTIVE_LOW | GPIO_PULL_UP)>',
  );
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('RC(0,5)');
});
test('BLE split uses separate GPIO namespaces and full key order in downloaded shields @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await openWiring(page);
  await page
    .getByRole('combobox', { name: 'Keyboard topology', exact: true })
    .selectOption('split');
  await page.getByText('Manual assignments', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Key 2 half', exact: true })).toHaveValue(
    'right',
  );
  for (const half of ['left', 'right']) {
    await page.getByRole('combobox', { name: `${half} row 0 pin`, exact: true }).selectOption('0');
    await page.getByRole('combobox', { name: `${half} row 1 pin`, exact: true }).selectOption('1');
    await page.getByRole('combobox', { name: `${half} col 0 pin`, exact: true }).selectOption('2');
  }
  await page.getByRole('combobox', { name: 'left col 1 pin', exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const project = await saved(page);
  expect(project.keys.map((key) => key.half)).toEqual([
    'left',
    'left',
    'right',
    'left',
    'left',
    'right',
  ]);
  await editNumber(page, 'left columns', '3');
  await page.getByRole('combobox', { name: 'Key 2 half', exact: true }).selectOption('left');
  await editNumber(page, 'Key 2 matrix column', '2');
  await page.getByRole('combobox', { name: 'left col 2 pin', exact: true }).selectOption('4');
  await expect(
    page.getByRole('button', { name: 'left row 0 col 2: Key 2', exact: true }),
  ).toBeVisible();
  expect(await saved(page)).toEqual(project);
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const moved = await saved(page);
  expect(getWiringCells(moved).find((cell) => cell.keyId === 'k2')).toMatchObject({
    half: 'left',
    row: 0,
    col: 2,
  });
  const movedFiles = await downloadZip(page);
  expect(movedFiles['boards/shields/unibody_six/unibody_six_right.overlay']).toContain(
    'col-offset = <3>;',
  );
  await workspace(page, 'Schematic');
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(project);
  const files = await downloadZip(page);
  expect(files['build.yaml']).toBe(
    'include:\n  - board: nice_nano_v2\n    shield: unibody_six_left\n  - board: nice_nano_v2\n    shield: unibody_six_right\n',
  );
  expect(files['boards/shields/unibody_six/unibody_six_right.overlay']).toContain(
    'col-offset = <2>;',
  );
  expect(files['boards/shields/unibody_six/unibody_six.dtsi']).toContain('RC(1,2)');
  expect(files['config/unibody_six.keymap']).toContain('&kp A');
});

test('missing GPIO problem opens its collapsed wiring control for repair @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await openWiring(page);
  await page.getByRole('combobox', { name: 'left row 0 pin', exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /Schematic: left row t0 has no pin/u }).click();
  const pin = page.getByRole('combobox', { name: 'left row 0 pin', exact: true });
  await expect(pin).toBeVisible();
  await expect(pin).toBeFocused();
  await pin.selectOption('2');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    '<&pro_micro 2 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>',
  );
});

test('keyboard grid assignment, auto and diode direction preserve geometry @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await openWiring(page);
  await page.getByText('Manual assignments', { exact: true }).click();
  await page.getByRole('combobox', { name: 'left key to assign', exact: true }).selectOption('k0');
  const cell = page.getByRole('button', { name: 'left row 1 col 0: Key 3', exact: true });
  await cell.focus();
  await cell.press('Enter');
  await expect(
    page.getByRole('button', { name: 'left row 1 col 0: Key 0, Key 3', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(UNIBODY_PRESET);
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const assigned = await saved(page);
  expect(assigned.keys).toEqual(UNIBODY_PRESET.keys);
  expect(assigned.layers).toEqual(UNIBODY_PRESET.layers);
  expect(getWiringCells(assigned).map((entry) => [entry.row, entry.col])).toEqual([
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ]);
  const direction = page.getByRole('combobox', { name: 'Diode direction', exact: true });
  await direction.selectOption('row2col');
  await direction.press('Escape');
  await expect(direction).toHaveValue('col2row');
  expect(await saved(page)).toEqual(assigned);
  await direction.selectOption('row2col');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const reversed = await saved(page);
  expect(reversed.keys.map((key) => key.diode?.cathode)).toEqual(
    Array.from({ length: 6 }, () => 'toward-switch'),
  );
  await page.reload();
  expect(await saved(page)).toEqual(reversed);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    'diode-direction = "row2col";',
  );
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    'col-gpios = <&pro_micro 8 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>',
  );
});

test('Auto assign proposes free GPIOs with outward outputs and atomic history @cross-browser', async ({
  page,
}, testInfo) => {
  const project = { ...UNIBODY_PRESET, wires: [], insulatedCrossings: [] };
  await openProject(page, project);
  await openWiring(page);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await expect(page.getByText('Wiring preview', { exact: true })).toBeVisible();
  await expect(page.getByText(/Check GPIOs against your hardware before Apply/u)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'left row 0 pin', exact: true })).toHaveValue(
    '0',
  );
  expect(await saved(page)).toEqual(project);
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  expect(await saved(page)).toEqual(project);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.getByRole('application').hover();
  await page.mouse.wheel(0, -40);
  await expect(page.locator('svg text').filter({ hasText: 'C0 D2' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('auto-preview.png') });
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).click();
  const applied = await saved(page);
  expect(applied.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([0, 1, 2, 3, 4]);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(project);
  await history(page, 'Redo').click();
  await expect.poll(() => saved(page)).toEqual(applied);
  await page.reload();
  await expect.poll(() => saved(page)).toEqual(applied);
  expect(JSON.parse(await downloadJson(page))).toEqual(applied);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('<&pro_micro 0');
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('<&pro_micro 4');
});

test('Auto assign capacity failure explains recovery without a saved change @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Keyboard preset', exact: true })
    .selectOption('ansi-104');
  await page.getByRole('button', { name: 'Create project from preset', exact: true }).click();
  const before = await saved(page);
  await openWiring(page);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('GPIOs');
  await expect(page.getByRole('alert')).toContainText('group rows manually');
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Recalculate wiring', exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(before);
});
