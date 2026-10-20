import { expect, test } from '@playwright/test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { getControllerBoard } from '@catalog/controllers';
import { editWiring } from '@domain/wiring/editing';
import {
  downloadJson,
  downloadZip,
  history,
  importText,
  openProject,
  saved,
  workspace,
} from './helpers';

const EXPECTED = String.raw`CONFIG_USB_DEVICE_MANUFACTURER="Maker \"A\""
CONFIG_ZMK_HID_REPORT_TYPE_NKRO=y
CONFIG_ZMK_IDLE_TIMEOUT=45000
CONFIG_ZMK_WPM=y
`;

test('Firmware typed settings persist through native input, undo and real JSON/ZIP @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Firmware');
  await page.getByRole('switch', { name: 'Words per minute', exact: true }).press('Space');
  const idle = page.getByRole('spinbutton', { name: 'Idle timeout (ms)' });
  await idle.fill('45000');
  await idle.press('Enter');
  await page.getByRole('combobox', { name: 'Keyboard rollover' }).selectOption('NKRO');
  const manufacturer = page.getByRole('textbox', { name: 'USB manufacturer' });
  await manufacturer.fill('Maker "A"');
  await manufacturer.press('Enter');
  const expected = {
    CONFIG_ZMK_WPM: true,
    CONFIG_ZMK_IDLE_TIMEOUT: 45_000,
    CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO',
    CONFIG_USB_DEVICE_MANUFACTURER: 'Maker "A"',
  };
  await expect.poll(async () => (await saved(page)).firmware).toEqual(expected);
  await history(page, 'Undo').click();
  await expect(manufacturer).toHaveValue('ZMK Project');
  await history(page, 'Redo').click();
  await expect(manufacturer).toHaveValue('Maker "A"');
  await idle.fill('999');
  await idle.press('Escape');
  await expect(idle).toHaveValue('45000');
  await page.reload();
  await workspace(page, 'Firmware');
  await expect(page.getByRole('spinbutton', { name: 'Idle timeout (ms)' })).toHaveValue('45000');
  const json = await downloadJson(page);
  const downloaded: unknown = JSON.parse(json);
  expect(downloaded).toEqual({ ...UNIBODY_PRESET, firmware: expected });
  await importText(page, json);
  const files = await downloadZip(page);
  expect(files['config/unibody_six.conf']).toBe(EXPECTED);
  expect(await page.getByLabel('config/unibody_six.conf', { exact: true }).textContent()).toBe(
    EXPECTED,
  );
  expect(files['boards/shields/unibody_six/Kconfig.defconfig']).not.toContain('45000');
});

test('Firmware search reveals invalid hidden field and repairs blocked export @cross-browser', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await workspace(page, 'Firmware');
  const press = page.getByRole('spinbutton', { name: 'Press debounce (ms)' });
  await press.fill('-2');
  await press.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Firmware, 1 problem', exact: true }),
  ).toBeVisible();
  await expect(press).toHaveAttribute('aria-invalid', 'true');
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await workspace(page, 'Firmware');
  await page.getByRole('searchbox', { name: 'Search firmware settings' }).fill('no-settings-match');
  await expect(page.getByText('No firmware settings match your search.')).toBeVisible();
  await page.getByRole('button', { name: 'Problems (1)', exact: true }).click();
  await page.getByRole('button', { name: /Firmware: Press debounce:/u }).click();
  await expect(press).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await press.fill('0');
  await press.press('Enter');
  await expect
    .poll(async () => (await saved(page)).firmware)
    .toEqual({ CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: 0 });
  await page.getByRole('button', { name: 'Reset Press debounce', exact: true }).click();
  await expect.poll(async () => (await saved(page)).firmware).toEqual({});
  const files = await downloadZip(page);
  expect(files['config/unibody_six.conf']).toBe('# No user settings; use ZMK v0.3 defaults.\n');
});

test('split central-only Firmware configuration downloads actual half files', async ({ page }) => {
  const board = getControllerBoard('nice_nano_v2');
  const initialized = editWiring(UNIBODY_PRESET, { kind: 'initialize', board });
  if (!initialized.ok) {
    throw new Error(initialized.error);
  }
  const split = editWiring(initialized.value, { kind: 'topology', topology: 'split', board });
  if (!split.ok) {
    throw new Error(split.error);
  }
  let project = split.value;
  for (const half of ['left', 'right']) {
    const terminals =
      project.wiring?.terminals.filter(
        (terminal) => terminal.half === half && terminal.kind !== 'ground',
      ) ?? [];
    for (const [index, terminal] of terminals.entries()) {
      const assigned = editWiring(project, {
        kind: 'pin',
        terminalId: terminal.id,
        boardPin: board.gpioPins[index],
        board,
      });
      if (!assigned.ok) {
        throw new Error(assigned.error);
      }
      project = assigned.value;
    }
  }
  await openProject(page, project);
  await workspace(page, 'Firmware');
  await page.getByRole('switch', { name: 'Fetch peripheral battery', exact: true }).check();
  await page
    .getByRole('switch', { name: 'Report peripheral battery to host', exact: true })
    .check();
  await page.getByRole('switch', { name: 'USB boot protocol', exact: true }).check();
  const files = await downloadZip(page);
  expect(files['config/unibody_six.conf']).toBeUndefined();
  expect(files['config/unibody_six_left.conf']).toBe(
    'CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y\nCONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y\nCONFIG_ZMK_USB_BOOT=y\n',
  );
  expect(await page.getByLabel('config/unibody_six_left.conf', { exact: true }).textContent()).toBe(
    files['config/unibody_six_left.conf'],
  );
  expect(
    await page.getByLabel('config/unibody_six_right.conf', { exact: true }).textContent(),
  ).toBe(files['config/unibody_six_right.conf']);
  await expect(page.getByLabel('config/unibody_six.conf', { exact: true })).toHaveCount(0);
  expect(files['config/unibody_six_right.conf']).toBe(
    '# No user settings; use ZMK v0.3 defaults.\n',
  );
  expect(files['build.yaml']).toContain('shield: unibody_six_left');
  expect(files['build.yaml']).toContain('shield: unibody_six_right');
});
