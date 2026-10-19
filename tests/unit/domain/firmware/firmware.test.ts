import { describe, expect, it } from 'vitest';
import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import { getControllerBoard } from '@catalog/controllers';
import { getProjectResourceError, createProject } from '@domain/project';
import {
  getFirmwareDefault,
  setFirmwareOption,
  resetFirmwareOption,
  validateFirmware,
} from '@domain/firmware';
import { reduceProjectHistory } from '@ui/project/logic';

const board = getControllerBoard('nice_nano_v2');
const context = { options: FIRMWARE_OPTIONS, board };
const initial = createProject({ controllerId: board.id });

function option(id: string) {
  const found = FIRMWARE_OPTIONS.find((entry) => entry.id === id);
  if (found === undefined) {
    throw new Error(id);
  }
  return found;
}

it('provides all four types and pinned descriptions/docs without board-owned switches', () => {
  expect(new Set(FIRMWARE_OPTIONS.map((entry) => entry.kind))).toEqual(
    new Set(['bool', 'int', 'enum', 'string']),
  );
  for (const entry of FIRMWARE_OPTIONS) {
    expect(entry.description.length).toBeGreaterThan(15);
    expect(entry.docsUrl).toMatch(/^https:\/\/v0-3-branch.zmk.dev\/docs\/.*#/u);
  }
  expect(FIRMWARE_OPTIONS.map((entry) => entry.id)).not.toContain('CONFIG_ZMK_BLE');
  expect(FIRMWARE_OPTIONS.map((entry) => entry.id)).not.toContain('CONFIG_ZMK_USB');
});

it('edits immutably, drops defaults, preserves no-op identity and exact history', () => {
  Object.freeze(initial);
  const next = setFirmwareOption(initial, {
    option: option('CONFIG_ZMK_IDLE_TIMEOUT'),
    value: 45_000,
    board,
  });
  expect(next.firmware).toEqual({ CONFIG_ZMK_IDLE_TIMEOUT: 45_000 });
  expect(initial.firmware).toEqual({});
  expect(next.keys).toBe(initial.keys);
  expect(
    setFirmwareOption(next, { option: option('CONFIG_ZMK_IDLE_TIMEOUT'), value: 45_000, board }),
  ).toBe(next);
  const history = reduceProjectHistory(
    { past: [], present: initial, future: [] },
    { kind: 'commit', update: () => next },
  );
  expect(reduceProjectHistory(history, { kind: 'undo' }).present).toBe(initial);
  expect(
    reduceProjectHistory(reduceProjectHistory(history, { kind: 'undo' }), { kind: 'redo' }).present,
  ).toBe(next);
  expect(
    setFirmwareOption(next, { option: option('CONFIG_ZMK_IDLE_TIMEOUT'), value: 30_000, board }),
  ).toEqual(initial);
  expect(resetFirmwareOption(next, 'CONFIG_ZMK_IDLE_TIMEOUT')).toEqual(initial);
  expect(resetFirmwareOption(initial, 'CONFIG_ZMK_IDLE_TIMEOUT')).toBe(initial);
});

it('uses applicable board defaults for battery reporting/BAS', () => {
  const battery = option('CONFIG_ZMK_BATTERY_REPORTING');
  expect(getFirmwareDefault(initial, { option: battery, board })).toBe(true);
  expect(
    getFirmwareDefault(initial, {
      option: battery,
      board: getControllerBoard('sparkfun_pro_micro_rp2040'),
    }),
  ).toBe(false);
});

describe('repairable semantic issues', () => {
  it.each([
    ['CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS', -2],
    ['CONFIG_ZMK_KSCAN_DEBOUNCE_RELEASE_MS', 1001],
    ['CONFIG_ZMK_IDLE_TIMEOUT', 1.5],
    ['CONFIG_ZMK_IDLE_TIMEOUT', Number.MAX_SAFE_INTEGER],
    ['CONFIG_ZMK_IDLE_TIMEOUT', true],
    ['CONFIG_ZMK_WPM', 'y'],
    ['CONFIG_ZMK_HID_REPORT_TYPE', 'INVALID'],
    ['CONFIG_USB_DEVICE_MANUFACTURER', 'bad\nCONFIG_FAKE=y'],
    ['CONFIG_USB_DEVICE_MANUFACTURER', ''],
    ['CONFIG_USB_DEVICE_MANUFACTURER', '🙂'.repeat(17)],
    ['CONFIG_UNKNOWN', true],
  ])('reports %s=%s at its firmware path', (id, value) => {
    const project = { ...initial, firmware: { [id]: value } };
    expect(validateFirmware(project, context)).toEqual([
      expect.objectContaining({ path: ['firmware', id] }),
    ]);
  });
  it('reports prerequisite and topology errors, then clears them after repair', () => {
    const invalid = { ...initial, firmware: { CONFIG_ZMK_IDLE_SLEEP_TIMEOUT: 600_000 } };
    expect(validateFirmware(invalid, context)[0]?.message).toContain('Deep sleep');
    expect(
      validateFirmware(
        { ...invalid, firmware: { ...invalid.firmware, CONFIG_ZMK_SLEEP: true } },
        context,
      ),
    ).toEqual([]);
    const splitOnly = {
      ...initial,
      firmware: { CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING: true },
    };
    expect(validateFirmware(splitOnly, context)[0]?.message).toContain('split');
    expect(
      validateFirmware(
        {
          ...initial,
          controllerId: 'sparkfun_pro_micro_rp2040',
          firmware: { CONFIG_ZMK_BLE_PASSKEY_ENTRY: true },
        },
        { ...context, board: getControllerBoard('sparkfun_pro_micro_rp2040') },
      )[0]?.message,
    ).toContain('BLE');
  });
  it('accepts bounds and default-only inactive settings', () => {
    expect(
      validateFirmware(
        {
          ...initial,
          firmware: {
            CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: -1,
            CONFIG_ZMK_KSCAN_DEBOUNCE_RELEASE_MS: 1000,
            CONFIG_ZMK_IDLE_SLEEP_TIMEOUT: 900_000,
          },
        },
        context,
      ),
    ).toEqual([]);
  });
});

it('disabling reporting and BAS together is valid and BAS effective default becomes off', () => {
  const project = {
    ...initial,
    firmware: { CONFIG_ZMK_BATTERY_REPORTING: false, CONFIG_BT_BAS: false },
  };
  expect(validateFirmware(project, context)).toEqual([]);
  expect(getFirmwareDefault(project, { option: option('CONFIG_BT_BAS'), board })).toBe(false);
});

it('refuses edits exceeding firmware storage budgets without losing the last saveable project', () => {
  const full = {
    ...initial,
    firmware: Object.fromEntries(
      Array.from({ length: 128 }, (_, index) => [`CONFIG_UNKNOWN_${index}`, true]),
    ),
  };
  const added = setFirmwareOption(full, { option: option('CONFIG_ZMK_WPM'), value: true, board });
  expect(getProjectResourceError(added)).toContain('128 firmware');
  expect(
    getProjectResourceError({
      ...initial,
      firmware: { CONFIG_USB_DEVICE_MANUFACTURER: 'a'.repeat(1025) },
    }),
  ).toContain('1024');
  expect(
    getProjectResourceError({
      ...initial,
      firmware: { CONFIG_USB_DEVICE_MANUFACTURER: 'a'.repeat(1024) },
    }),
  ).toBeUndefined();
});
