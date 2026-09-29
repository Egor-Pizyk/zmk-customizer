# Quickstart: Key behaviors validation

**Date**: 2026-09-29 · How to prove the feature works end-to-end. No implementation code here — commands and expected outcomes only.

## Prerequisites

- Dev server running (`make up`, http://localhost:5173) or `npm run dev`.
- A project with ≥3 keys (draw in Schematic, or reuse any saved project file).
- For UI checks: headless Chrome with CDP; seed the project via `localStorage` key `zmk-customizer:project`; click `[data-keycap-id]`; screenshot with `Page.captureScreenshot`.

## 1. Automated gate (must be green before and after every change)

```sh
make check
```

Expected: typecheck + lint + format check + all tests pass. New/changed tests live next to code (`domain/*.test.ts`, `catalog/behaviors.test.ts`, `storage/*-schema/file*.test.ts`, `ui/bindings/format-*.test.ts`).

## 2. Phase 0 — every stored behavior is choosable

1. Select a key → behavior list shows all 13 behaviors, each with description + v0.3 docs link.
2. Pick each of pass-through / do nothing / caps word / key repeat / grave-escape / reset / bootloader → applies in one click, keycap shows ▽ / ✕ / CW / REP / ⎋` / RST / BOOT; tooltip and table row name it.
3. Pick Bluetooth select profile 1, disconnect 0, next, output USB → legends `BT 1`, `BT✕0`, `BT→`, `USB`.
4. Reload → all bindings identical; Save → Open file → identical; Undo/Redo → one step per pick.
5. Multi-select 3 keys → pick one behavior → all three change in one undo step. Copy/paste a Bluetooth binding → works.

## 3. Tap-dance

1. Pick "Tap dance" → seeded from current key (or plain A), pause 200 ms shown.
2. Set taps A, then Shift+B; set pause 250 → keycap identifies tap-dance; tooltip lists both taps + pause; reload + file round trip → identical.
3. Pause −5 / 99999 → rejected where entered with the 0–5000 range shown.
4. Import a file with `"tappingTermMs": 99999` → loads; key reported under Bindings naming the key and range.

## 4. Mod-morph

1. Pick "Mod-morph" → normal = morphed = current key, trigger Shift; Bindings notes normal == morphed.
2. Set normal Escape, morphed Grave → note clears; tooltip names both + trigger; reload + round trip → identical.
3. `gresc` preset still offered separately and applies in one click.

## 5. Scope guards (must hold while this feature is latest)

- Behavior list contains no layer behavior (momentary/toggle/switch-to/sticky-layer/layer-tap), no combo/macro/conditional-layer, no RGB/backlight/mouse/soft-off/Studio entry (manual walkthrough).
- Importing a file with `"kind": "mo"` (or any layer kind) → rejected with a message naming the problem; current project unchanged.
- Every behavior and keycode entry has a working v0.3 docs link (covered by `catalog/behaviors.test.ts` + keycode tests).
- Keyboard-only run: Tab to keycap → Enter → search → Enter assigns; chips/hold/mode/tap-list/pause/modifier controls all reachable and labeled; table alternative assigns and pastes.
