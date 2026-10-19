# Verification: 016 custom behaviors

Date: 2026-10-18. Implemented on `016-custom-behaviors`, preserving the pre-existing dirty 014/015 tree. No dependencies added; no commit or publication requested.

## Results

- Spec analysis: all nine requirements and three success criteria mapped in tasks.md; no blocking finding. Separate spec reviewer approved with minor artifact corrections, applied before implementation.
- Tests first: lifecycle module initially missing; validation tests failed before validator; v8 fixture/round trip failed before v9 migration; independent golden failed before named renderer. Subsequent focused run: 26 files / 197 tests passed. Additional regressions cover nested timing/BT, resource limits, stable tap IDs, parameters and clipboard ID reservation.
- `make check`: passed, exit 0; 187 Vitest files / 1105 tests passed, all architecture/guideline/tooling/type/lint/format and coverage gates passed. Earlier coverage failure at 97.77% domain lines prompted resource/parameter/controller regression scenarios; floors were retained.
- Production build: passed through isolated Playwright webServer (`npm run build`); no runtime packages added. Vite reports its existing large-chunk advisory.
- `make test-e2e`: passed, 124 scenarios, complete Chromium plus targeted Firefox/WebKit, no retries.
- Changed journey sequential runs: full suite above, then `behaviors.spec.ts` twice: 4/4 in 21.4 s, 4/4 in 20.4 s. Native keyboard/inputs, actual saved JSON and downloaded ZIP covered.
- Controlled browser regression, run alone: temporarily disabled `removeBehavior`; Chromium shared-behavior test failed at the visible Download export-block assertion (`aria-disabled`). Exact original production bytes restored in finally. Baselines had passed before mutation; compiler/runner failures were not counted.
- `make zmk-build`: passed for 23 actual-export targets, including all five custom behavior types and configured hold-tap flags, plus intentional invalid-connector rejection. ZMK v0.3.0/Zephyr pins checked by existing runner. The subsequent final 017 build passed all 24 targets, covering the combined final tree after name-segment truncation; see [017 verification](../017-combos-macros-conditional-layers/verification.md).
- ZMK reviewer: initial negative-cell and nested-validation findings fixed, with independent expected syntax corrected against pinned notes. Follow-up approved with minor node-name recommendation; sanitized name segment subsequently bounded to 16 characters.

## Browser evidence and risk

| Scenario | Risk | Existing coverage | New E2E | Visible assertion | Saved/exported assertion |
|---|---|---|---|---|---|
| Create/assign shared hold-tap | References copied or assigned to wrong keys | Existing built-in picker/history journeys | behaviors.spec.ts shared definitions | Both table cells show Home | k0/k1 retain b0 and typed args; two matching ZIP references |
| Edit/persist options | Draft lost or repeated commits | Existing input/history tests | shared definitions | 250 ms after reload | JSON contains timing; keymap emits it |
| Delete/Undo | Silent retargeting or export allowed | Existing deleted-layer/export guards | shared definitions | Both key errors; download blocked; Undo repairs | Definition restored and actual ZIP renders |
| Five definition types | Unsupported syntax or hidden controls | Legacy inline golden tests | all types | Sticky timeout field and Lazy checkbox | Four named nodes plus saved 1200 ms/lazy in ZIP |

Earlier browser failures were test setup/locator mistakes: closed Keys table and ambiguous text matching hidden option elements. Tests now open the real table and target summaries; saved/exported assertions were preserved. Failure traces/screenshots remain ignored Playwright artifacts.

## Limits

Automated keyboard, focus, native input and cross-browser checks ran. Physical keyboard-only manual walkthrough, screen-reader speech, OS contrast/reduced-motion and manual zoom review were not performed. Native app control was not authorized; no claim of manual accessibility verification is made. Firmware compiled but was not flashed or exercised on hardware. Existing user changes were retained.
