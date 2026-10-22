import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { parseProjectFile, serializeProject } from '@storage/project';
import fixtureV7 from '../../../fixtures/project/v7-firmware-legacy.json?raw';

it('migrates an untouched v7 project without losing wiring/bindings', () => {
  const parsed = parseProjectFile(fixtureV7);
  expect(parsed).toEqual({
    ok: true,
    value: {
      schemaVersion: 13,
      encoders: [],
      combos: [],
      macros: [],
      conditionalLayers: [],
      behaviors: [],
      firmware: {},
      controllerId: 'nice_nano_v2',
      name: 'Legacy',
      keys: [{ id: 'k0', xU: 1, yU: 2 }],
      wires: [],
      insulatedCrossings: [],
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: { k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
        },
      ],
    },
  });
});
it('round trips all types and retains repairable invalid/unknown settings', () => {
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    firmware: {
      CONFIG_ZMK_WPM: true,
      CONFIG_ZMK_IDLE_TIMEOUT: -3,
      CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO',
      CONFIG_USB_DEVICE_MANUFACTURER: 'A "B" \\ C',
      CONFIG_UNKNOWN: true,
    },
  };
  const saved = serializeProject(project);
  expect(saved.ok).toBe(true);
  expect(parseProjectFile(getResultValue(saved))).toEqual({ ok: true, value: project });
});
it.each([null, [], { CONFIG_ZMK_WPM: [] }, { CONFIG_ZMK_WPM: null }])(
  'rejects malformed firmware %j',
  (firmware) => {
    expect(
      parseProjectFile(
        JSON.stringify({ ...createProject({ controllerId: 'nice_nano_v2' }), firmware }),
      ).ok,
    ).toBe(false);
  },
);
