# Controller golden differences

Reference: pinned upstream Reviung41 and independent unibody/repository expectations. Overlay variants authored before generator changes; only connector label varies. Same new preset D2/D6 rows and D8/D9/D10 columns across all boards; this new preset uses connector positions, while importing an old raw-pin preset preserves physical contacts through migration. build.yaml differs only in verified v0.3 board id. All remaining repository files equal the independent repository goldens. No board-specific overlays for plain matrix kscan. This is text validation, not firmware compilation.

USB-only RP2040 variants replace Fn k3 Bluetooth clear with &none and omit the unused bt.h header. Bindings stay untouched on real board switches and incompatible actions are reported by validation. USB output and other supported behaviors are unchanged.
