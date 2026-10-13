import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { expect, it } from 'vitest';
import { validateControllerBindings } from '@domain';

const { project: UNIBODY_PRESET, getBoard: getControllerBoard } = getControllerFixtures();

it('blocks Bluetooth actions on USB-only boards without deleting bindings', () => {
  const usb = getControllerBoard('adafruit_kb2040');
  const changed = { ...UNIBODY_PRESET, controllerId: usb.id };
  const issues = validateControllerBindings(changed, usb);
  expect(issues).toContainEqual(
    expect.objectContaining({
      code: 'binding-controller-unsupported',
      path: ['layers', 1, 'bindings', 'k3'],
    }),
  );
  expect(changed.layers).toBe(UNIBODY_PRESET.layers);
  const output = {
    ...changed,
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: { k0: { kind: 'out' as const, command: 'OUT_BLE' as const } },
      },
    ],
  };
  expect(validateControllerBindings(output, usb)).toContainEqual(
    expect.objectContaining({
      code: 'binding-controller-unsupported',
      path: ['layers', 0, 'bindings', 'k0'],
    }),
  );
  expect(validateControllerBindings(UNIBODY_PRESET, getControllerBoard('nice_nano_v2'))).toEqual(
    [],
  );
});
