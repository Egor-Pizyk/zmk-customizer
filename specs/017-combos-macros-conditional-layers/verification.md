# Verification: 017 combos, macros and conditional layers

Date: 2026-10-18. Branch: `017-combos-macros-conditional-layers`, continuing completed 016 and preserving pre-existing 014/015 work. No runtime dependencies added.

## Results

- Spec analysis/reviewer: approved after clarifying macro locations; hold-tap children retain the built-in-only 016 contract.
- Tests first: initial domain/storage contracts failed with missing advanced modules/migration before implementation; independent section golden failed before rendering implementation. Focused final domain/generator review: 7 files / 22 tests passed.
- ZMK reviewer: approved, including follow-up after budget/refactor changes; pinned-source pause encoding, nested action/header collection, graph cycles and conservative queue budgets reviewed.
- Coverage regression: first full run exposed missing boundary/reference/editor scenarios. Added immutable no-op/collection bounds, stale step operations, mixed behavior/macro recursion and shared acyclic references, resource guards, sorting/nested export and labeled editor tests. Existing floors retained. Local coverage run: 196 files / 1136 tests passed, all coverage thresholds passed.
- `make check`: passed, exit 0; 196 files / 1136 tests. Architecture/guideline/tooling/type/lint/format gates passed. Domain lines 98.83%, branches 94.63%; generators functions 100%, branches 96.13%; storage functions 100%; UI functions 87.91%.
- Production build: passed through isolated Playwright webServer (`npm run build`); existing large-chunk advisory remains.
- `make zmk-build`: passed, exit 0; all 24 actual-export targets, including custom-behaviors and advanced-keymap, plus intentional invalid-connector rejection. This compiles the final combined 016/017 production tree against pinned ZMK v0.3.0.
- `make test-e2e`: passed, exit 0; all 130 scenarios in 5.7 minutes, complete Chromium and targeted Firefox/WebKit, no retries.
- Three sequential final changed-journey baselines: full suite above, then `advanced-keymap.spec.ts` 6/6 in 32.6 s and 6/6 in 31.6 s. No retries, production edits or mutations between these three baselines.
- Controlled browser mutation, run alone after all other runners completed: replaced emitted pause duration with zero. Chromium create journey failed on the actual downloaded ZIP keymap `toContain` assertion for the requested 120 ms pause. Exact original production bytes restored in finally; compiler/runner failures were not counted.

## Browser evidence and risk

| Scenario | Risk | Existing coverage | New E2E | Visible assertion | Saved/exported assertion |
|---|---|---|---|---|---|
| Create sequence and assign macro | Wrong mode/order/reference | Built-in picker and 016 actions/history | advanced-keymap.spec.ts create journey | Table shows Sequence | JSON k0→m1; ZIP contains two references and exact pause expansion |
| Create combo and layer filter | Incorrect key positions/filter | Existing key identity/renumber coverage | create and identity journeys | Named controls and combo error after deletion | ZIP positions/filter reflect current key identities |
| Conditional activation | Wrong indices after layer changes | Existing layer edits/references | both journeys | Invalid target focuses Target layer | JSON IDs and ZIP input/target indices checked |
| Delete referenced key/layer/macro | Silent removal, retarget or invalid export | Existing deletion/history/export guards | both journeys | Problems focus correct editor; download blocked | Undo restores identical saved project and downloaded keymap |
| Persistence and downloads | UI diverges from file/export | Existing JSON/ZIP helpers | create journey | Native controls/keyboard activation | Downloaded JSON parses equal to saved data; reload retains it |

First browser run found an ambiguous field locator and the table formatter omitting macro definitions (showed a deleted-name fallback for a valid macro). Locator made exact, table formatter now receives current definitions; saved/exported assertions retained. A subsequent full changed-file run passed 6/6 across Chromium/Firefox/WebKit with no retries.

## Limits

Automated keyboard activation, native inputs, focus and three-browser checks ran. Physical keyboard-only walkthrough, screen-reader speech, OS contrast/reduced-motion and manual zoom review were not performed. Firmware compilation does not establish hardware behavior; no flashing was performed. No claim of manual accessibility verification is made.
