# Verification: Keymap editor acceptance

Date: 2026-10-17. Branch `014-keymap-editor`; no commits created. Status: all automated gates passed; manual accessibility gate pending.

## SDD and independent review

Applied specify → clarify → plan → tasks → analyze → implement skills. Explicit feature directory persisted and resolved by `.specify/scripts/bash/check-prerequisites.sh --json --paths-only`, setup-plan, setup-tasks and preimplementation prerequisite check; every result selected `specs/014-keymap-editor`, never 030/013. No extension hooks are configured. Requirements checklist 7/7 passes; ambiguity scan found no material questions. Analysis: 6 requirements, 9 tasks (after focus-gap amendment), 100% requirement task coverage, 0 ambiguity/duplication/critical findings.

Independent `.claude/agents/spec-reviewer.md` review initially requested manual a11y task and earlier preimplementation gate; both corrected. Re-review verdict ready to implement; subsequent FR-002 focus amendment also reviewed with no findings. No generator/catalog edits require ZMK review. Current syntax/fixtures are unchanged.

## Requirement coverage

| Requirement | Tasks | Check and independent assertion | Evidence |
|---|---|---|---|
| FR-001 | T001 | tests/e2e/keymap.spec.ts current catalog preset created through New dialog: all layers/keys inspected, JSON saved/reopened/reloaded equals original, actual ZIP config and shield keymaps equal existing approved golden | Full suite and 3 repeated all-engine runs pass |
| FR-002 | T001,T009 | Same no-edit journey: Undo/Redo stay disabled; Escape focuses inspected key. app-bindings regression checks key 1 focus, exact project and disabled Undo | Red then green; full make check and browser gates pass |
| FR-003 | T002,T003,T004 | app-bindings category regression; filter-picker-groups cases; E2E keyboard backspace/ENTER/letters selects BACKSPACE/RETURN/A and exact intended binding, then three Undo restore preset | Category red then green; full make check and browser gates pass |
| FR-004 | T005 | Existing move-layer permutations preserve all five layer behavior targets; validation rejects missing refs; browser reorder emits mo/lt index 0 and to index 1; deleting Fn reports keys 2 and 5 and blocks ZIP; two Undo restore exact project/golden | Full suite and 3 repeated all-engine runs pass |
| FR-005 | T005 | catalog/bindings/behaviors.test.ts covers every behavior/BT/output entry; keycodes.test.ts covers all 371 keycodes and nonempty descriptions/v0.3 URL | Included in make check |
| FR-006 | T001 | Every layer's Keys column header and every key's physical canvas accessible name are visible; table choose action and keyboard Escape work | Full suite and 3 repeated all-engine runs pass |

## Tests-first and test sensitivity

- Before category fix, focused app-bindings suite: 6 passed, 1 failed at visible `Nothing matches “letters”.` assertion. After fix, category interaction passed.
- Browser no-edit journey exposed focus returning to key 0 after table inspection of key 1. Dedicated jsdom regression before fix: 7 passed, 1 failed, expected `Key 1` but got `Key 0, Base layer: A, selected`. One-line owning handler fix updates active key before existing selection/panel actions. Subsequent Chromium journey passed.
- Initial browser scaffolding attempts found exact base tab name includes `always on` and Keys details starts collapsed; tests corrected to use actual accessible controls. Initial typecheck/lint issues in new tests corrected. No assertions were weakened.

## Commands

Final gate logs were retained outside git at `/tmp/zmk-014-check.log`, `/tmp/zmk-014-build.log`, `/tmp/zmk-014-e2e-full.log` and `/tmp/zmk-014-e2e-repeat-{1,2,3}.log`. Generated Playwright report/test-results remain ignored and are overwritten by subsequent runs. No screenshot baselines changed.

- `make check`: PASS; 177 Vitest files / 1041 tests, coverage statements 91.07%, branches 84.15%, functions 92.19%, lines 91.00%; all architecture/guideline/mutation-runner/release tooling contracts, types, lint and formatting pass.
- `docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run build`: PASS; existing >500 kB bundle warning, no build error.
- `git diff --check`: PASS.
- `make test-e2e`: PASS; 113 tests across Chromium (complete suite), Firefox and WebKit (focused browser cases), zero retries, 3.8 minutes. 
- Three sequential runs of `docker compose -p zmk-customizer -f infra/compose.e2e.yaml run --rm e2e npm run test:e2e -- tests/e2e/keymap.spec.ts`: PASS, 7/7 each (31.4s, 31.0s, 31.0s), zero retries. Each run includes 3 Chromium + 2 Firefox + 2 WebKit cases.
- Local Markdown link resolution for all 014 artifacts, specs index and roadmap: PASS.

Initial focused Chromium command `docker compose -p zmk-customizer -f infra/compose.e2e.yaml run --rm e2e npm run test:e2e -- tests/e2e/keymap.spec.ts --project chromium --max-failures 1`: 3 passed (14.2s).

## Browser risk coverage

No-edit inspection/cancellation risks hidden edits and output drift: exact disabled history, JSON and both downloaded keymap copies asserted. Category matching risks wrong target binding: visible chosen keycode and complete saved Project asserted. Focus recovery risks jumping to another key: actual browser focus asserted for all inspected keys. Layer reorder/deletion risks retargeting/invalid export: emitted numeric indices, both missing-key messages, disabled download and exact Undo recovery asserted. Existing layout/layer browser suites protect SVG and layer keyboard behavior; new keyboard/focus flows run Chromium, Firefox and WebKit. No new gestures or visual design are introduced.

## Manual accessibility gate and limits

T008 remains pending. No manual keyboard-only/visual focus-ring/VoiceOver or NVDA/200% native zoom pass has been claimed. Isolated Playwright checks provide automated keyboard/focus and semantic evidence, not screen-reader speech. AGENTS prohibits ordinary browser/native control without explicit user request; root requested authorization. No new tokens, colors, motion, dialogs or pointer gestures were introduced. Firmware was not compiled: no generator or exported geometry code changed, so make zmk-build is not selected by docs/commands.md for this change.
