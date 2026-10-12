import { expect, it } from 'vitest';
import { CONTROLLER_BOARDS } from './controller-boards';

it('provides exactly four pinned controllers with verified connector maps and docs', () => {
  expect(CONTROLLER_BOARDS.map((board) => board.id)).toEqual([
    'nice_nano_v2',
    'seeeduino_xiao_ble',
    'sparkfun_pro_micro_rp2040',
    'adafruit_kb2040',
  ]);
  const proMicro = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 18, 19, 20, 21];
  const expectedPins = { pro_micro: proMicro, seeed_xiao: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
  for (const board of CONTROLLER_BOARDS) {
    expect(board.gpioPins).toEqual(expectedPins[board.family]);
    expect(board.pins.map((pin) => pin.index)).toEqual(board.gpioPins);
    expect(board.description.length).toBeGreaterThan(10);
    expect(board.docsUrl).toBe(
      'https://v0-3-branch.zmk.dev/docs/development/hardware-integration/pinctrl#predefined-nodes',
    );
    expect(board.reservedContacts).toContain('GND');
    for (const pin of board.pins) {
      expect(pin.label).toContain(`D${pin.index}`);
      expect(pin.mcu.length).toBeGreaterThan(0);
    }
  }
  expect(CONTROLLER_BOARDS[0].pins.find((pin) => pin.index === 19)?.mcu).toBe('P0.02');
  expect(CONTROLLER_BOARDS[1].pins.find((pin) => pin.index === 6)?.mcu).toBe('P1.11');
  expect(CONTROLLER_BOARDS[2].pins.find((pin) => pin.index === 10)?.mcu).toBe('GP21');
  expect(CONTROLLER_BOARDS[3].pins.find((pin) => pin.index === 10)?.mcu).toBe('GP10');
});

it('keeps analog aliases on Pro Micro labels', () => {
  expect(CONTROLLER_BOARDS[0].pins.find((pin) => pin.index === 18)?.label).toBe('D18/A0');
  expect(CONTROLLER_BOARDS[0].pins.find((pin) => pin.index === 4)?.label).toBe('D4/A6');
});

it('uses manufacturer printed labels rather than AVR analog aliases on RP2040', () => {
  expect(CONTROLLER_BOARDS[2].pins.find((pin) => pin.index === 10)?.label).toBe('21/D10');
  expect(CONTROLLER_BOARDS[2].pins.find((pin) => pin.index === 14)?.label).toBe('CI/D14');
  expect(CONTROLLER_BOARDS[3].pins.find((pin) => pin.index === 15)?.label).toBe('CLK/D15');
  expect(CONTROLLER_BOARDS[3].pins.find((pin) => pin.index === 4)?.label).toBe('4/D4');
});
