# Project JSON contract

Version 4 keys may contain `"diode": { "pin": 1, "cathode": "away-switch" }`. No null, arrays, extra properties or other pin/direction values. Versions 1–3 migrate; old keys remain diode-free.
Generation contract: findKeyCurrentFlow yields `{ fromPin, toPin }` or undefined without a diode. After row/column derivation, all diode-bearing keys must agree with the driver's one diode-direction; contradictions block export. Projects without explicit diodes need an explicitly documented generation policy in shield-generators.
