import { getResultValue } from '../../helpers/result';
import { expect, it } from 'vitest';
import { generateConf } from '@generators';
import { generateRepositoryFiles } from '@generators/repository';
import { createProject } from '@domain/project';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { getControllerBoard } from '@catalog/controllers';
import { SHIELD_TARGET } from '@catalog/firmware';
import { UNIBODY_PRESET } from '../../helpers/unibody-preset';
import expected from '../../fixtures/expected/firmware/options.conf?raw';

it('renders independent sorted bool/int/enum/escaped-string golden, omits explicit defaults', () => {
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    firmware: {
      CONFIG_ZMK_SLEEP: true,
      CONFIG_ZMK_IDLE_TIMEOUT: 45_000,
      CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: 0,
      CONFIG_USB_DEVICE_MANUFACTURER: 'Maker "A" \\ Co',
      CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO',
      CONFIG_ZMK_WPM: false,
    },
  };
  expect(generateConf(project).content).toBe(expected);
  expect(
    generateConf({
      ...project,
      firmware: Object.fromEntries(Object.entries(project.firmware).toReversed()),
    }).content,
  ).toBe(expected);
});
it('keeps default output bytes and omits board-dependent explicit default', () => {
  const project = createProject({ controllerId: 'nice_nano_v2' });
  expect(generateConf(project).content).toBe('# No user settings; use ZMK v0.3 defaults.\n');
  expect(
    generateConf({ ...project, firmware: { CONFIG_ZMK_BATTERY_REPORTING: true } }).content,
  ).toBe(generateConf(project).content);
});
it('packages central-only split overrides in both half files without a shared config', () => {
  const project = {
    ...UNIBODY_PRESET,
    wiring: {
      kind: 'matrix',
      topology: 'split',
      diodeDirection: 'col2row',
      terminals: [],
    } as const,
    firmware: {
      CONFIG_ZMK_USB_BOOT: true,
      CONFIG_USB_DEVICE_MANUFACTURER: 'Maker',
      CONFIG_ZMK_IDLE_TIMEOUT: 45_000,
      CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING: true,
      CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY: true,
    },
  };
  // Packaging owns config routing; matrix here is independently supplied from the valid preset.
  const board = getControllerBoard('nice_nano_v2');
  const matrix = deriveShieldMatrix(UNIBODY_PRESET, { ...board, boardId: board.id });
  const validMatrix = getResultValue(matrix);
  const files = generateRepositoryFiles(project, {
    matrix: validMatrix,
    target: { ...SHIELD_TARGET, ...board, boardId: board.id },
    includeWorkflow: false,
  });
  expect(files.find((file) => file.path === 'config/unibody_six.conf')).toBeUndefined();
  expect(files.find((file) => file.path === 'config/unibody_six_left.conf')?.content).toBe(
    'CONFIG_USB_DEVICE_MANUFACTURER="Maker"\nCONFIG_ZMK_IDLE_TIMEOUT=45000\nCONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y\nCONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y\nCONFIG_ZMK_USB_BOOT=y\n',
  );
  expect(files.find((file) => file.path === 'config/unibody_six_right.conf')?.content).toBe(
    'CONFIG_ZMK_IDLE_TIMEOUT=45000\n',
  );
});

it('omits BAS off when reporting off removes its imply default', () => {
  expect(
    generateConf({
      ...createProject({ controllerId: 'nice_nano_v2' }),
      firmware: { CONFIG_ZMK_BATTERY_REPORTING: false, CONFIG_BT_BAS: false },
    }).content,
  ).toBe('CONFIG_ZMK_BATTERY_REPORTING=n\n');
});

it('returning a choice to its default removes the member line after edit and after imported explicit default', () => {
  const initial = createProject({ controllerId: 'nice_nano_v2' });
  const changed = { ...initial, firmware: { CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO' } };
  expect(generateConf(changed).content).toBe('CONFIG_ZMK_HID_REPORT_TYPE_NKRO=y\n');
  expect(
    generateConf({ ...initial, firmware: { CONFIG_ZMK_HID_REPORT_TYPE: 'HKRO' } }).content,
  ).toBe(generateConf(initial).content);
});
