# Research — Controller boards

## Controller catalog

Decision: nice_nano_v2, seeeduino_xiao_ble, sparkfun_pro_micro_rp2040, adafruit_kb2040, two connector families. Initial subset balances roadmap common boards with existing verified data; broader catalogs/custom boards deferred. No split model before 013.

Evidence (read-only research agent verified upstream):
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zephyr/blob/dacab4875df72109b96cc8977547a0dc04875bcd/boards/arm/seeeduino_xiao_ble/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/dacab4875df72109b96cc8977547a0dc04875bcd/boards/arm/sparkfun_pro_micro_rp2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/dacab4875df72109b96cc8977547a0dc04875bcd/boards/arm/adafruit_kb2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/seeeduino_xiao_ble.overlay (UART disabled; corresponding SparkFun/KB2040 overlays also disable UART).
- https://v0-3-branch.zmk.dev/docs/development/hardware-integration/pinctrl#predefined-nodes (verified v0.3 path).

Pro Micro valid indices: 0–10,14,15,16,18,19,20,21. XIAO: 0–10. Power/GND/reset are not connector GPIO entries; nice!nano internal P0.13 external power and P0.15 LED are not assignable. Bus roles do not permanently reserve their GPIOs while unused; no peripheral configuration exists yet.

## Pin representation and migration

Decision: keep wire endpoint boardPin as numeric connector index, add required controllerId, schemaVersion 5. Add optional droppedBoardPin string to a free endpoint with no boardPin; schema rejects both fields together. Catalog contains MCU labels and legacy raw port-0 mapping. This avoids touching routing/net identity and keeps assignments readable as Dn.

Legacy nice!nano raw port-0 mapping: 8→0,6→1,17→2,20→3,22→4,24→5,11→7,9→10,10→16,2→19,29→20,31→21. Convert only shape-valid old endpoints and integer 0–31 values; leave malformed values for schema rejection. Unmapped valid old GPIO: remove assignment and save `nice!nano v2 Pn` as droppedBoardPin. No port1 inference. Old top-level controllerId is unexpected and must not be silently overwritten.

Alternative: leave raw numbers and interpret them differently per board. Rejected because compatible connector swaps would silently rewire positions. Explicit connector objects unnecessarily expand all geometry/net code.

## Compatibility

Decision (user answer): clear all assignments between Pro Micro and XIAO. Preserve shared connector indices within a family. Dropped metadata persists across later changes, and explicit clear/reassignment removes it. Selection of the current board returns the same Project reference.

## Generator contract

Pass connector label into shield generation from selected catalog board; build.yaml uses selected board id, fixed release/workflow metadata stays in shield-target catalog. No board-specific overlay for plain kscan. Existing full repository golden baseline changes gpio0 to pro_micro; per-board expected overlay/build files are independently authored before implementation. Matrix index ordering remains connector-index ordering.

## Validation/accessibility

Controller invalid/unavailable endpoint errors are pure domain values. Dropped pin issues belong to Schematic and focus the existing board-pin select via path. A native label/select/description and DocsLink are used; native keyboard selection requires no custom focus logic. Tests cover keyboard change, descriptions, pin omission, validation text, undo history, export and storage. Manual screen reader/visual checks require user-requested browser/native control and are not claimed.

## Review: Bluetooth capability

Pinned app/CMakeLists.txt compiles behavior_bt.c only when CONFIG_ZMK_BLE, while the behavior node always exists. RP2040 bt bindings therefore fail linking. Add ble capability, block bt and OUT_BLE with Bindings issues, preserve all saved actions. OUT_USB/OUT_TOG implementation is unconditional. Source: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/CMakeLists.txt#L77 and docs/zmk/behaviors.md. Do not assign AVR-style A6–A10 labels to RP2040 GPIOs.

Manufacturer label evidence: https://cdn.sparkfun.com/assets/e/2/7/6/b/ProMicroRP2040_Graphical_Datasheet.pdf ; https://raw.githubusercontent.com/adafruit/Adafruit-KB2040-PCB/main/assets/5302.jpg ; https://files.seeedstudio.com/wiki/XIAO-BLE/XIAO_nRF52840_front_pinout.png . SparkFun printed D10 position is 21 (GP21), SPI CI/CO. KB2040 silk MI/CLK/MO. XIAO 0–10 with D/A/bus aliases. Full review findings fixed by catalog labels and capability validation.
