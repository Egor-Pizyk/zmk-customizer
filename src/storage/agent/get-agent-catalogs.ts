import {
  ADVANCED_OPTIONS,
  BEHAVIORS,
  BLUETOOTH_COMMANDS,
  BLUETOOTH_PROFILE_COUNT,
  CUSTOM_BEHAVIOR_PROPERTIES,
  CUSTOM_BEHAVIOR_TYPES,
  HOLD_TAP_FLAVORS,
  HOLD_TAP_TARGETS,
  KEYCODES,
  MACRO_OPTIONS,
  MACRO_STEP_KINDS,
  MODIFIER_BITS,
  MODIFIER_KEYCODES,
  OUTPUT_COMMANDS,
  BINDINGS_CATALOG,
} from '@catalog/bindings';
import { CONTROLLER_BOARDS, WIRING_OPTIONS } from '@catalog/controllers';
import { FIRMWARE_OPTIONS, ZMK_LIMITS } from '@catalog/firmware';
import { ENCODER_DEFAULTS, ENCODER_LIMITS, ENCODER_OPTIONS } from '@catalog/encoders';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { PROJECT_BUDGET } from '@domain/project';

export function getAgentCatalogs() {
  return {
    geometry: {
      unitKeyPins: ([1, 2] as const).map((pin) =>
        getKeyPinPosition({ id: 'k0', xU: 0, yU: 0 }, pin),
      ),
      precisionDecimals: 4,
    },
    controllers: CONTROLLER_BOARDS,
    wiring: WIRING_OPTIONS,
    keycodes: KEYCODES,
    modifiers: MODIFIER_BITS,
    modifierKeycodes: MODIFIER_KEYCODES,
    behaviors: BEHAVIORS,
    bluetoothCommands: BLUETOOTH_COMMANDS,
    bluetoothProfileCount: BLUETOOTH_PROFILE_COUNT,
    outputCommands: OUTPUT_COMMANDS,
    customBehaviorTypes: CUSTOM_BEHAVIOR_TYPES,
    customBehaviorProperties: CUSTOM_BEHAVIOR_PROPERTIES,
    holdTapTargets: HOLD_TAP_TARGETS,
    holdTapFlavors: HOLD_TAP_FLAVORS,
    macros: { options: MACRO_OPTIONS, stepKinds: MACRO_STEP_KINDS },
    advanced: { options: ADVANCED_OPTIONS, limits: BINDINGS_CATALOG.advancedLimits },
    firmware: FIRMWARE_OPTIONS,
    encoders: { defaults: ENCODER_DEFAULTS, limits: ENCODER_LIMITS, options: ENCODER_OPTIONS },
    limits: { project: PROJECT_BUDGET, zmk: ZMK_LIMITS },
  };
}
