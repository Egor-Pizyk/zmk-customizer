# Verification — feature 032

Date: 2026-10-20. Implementation and automated acceptance verified; manual accessibility and final delivery gates remain pending.

## Specification and independent review

Installed Spec Kit resolver selected 032, independently of the prior persisted 031 selection. User confirmed preserving valid pins, atomic conflict/capacity refusal and outward routing. Owning 013/031 contracts were amended before implementation. Eight requirements map to the implementation tasks. Spec review identified contract timing, capacity scenarios and retained-net ambiguity; corrected artifacts received “ready to implement”.

Independent ZMK/domain review found invalid/duplicate encoder reservations and legacy GPIO validation gaps. Tests failed with pins 99/98, duplicate 0/0 and legacy GPIO99 before the fixes. Final review approved without blockers. No generator syntax, board facts, schema, migrations or runtime dependencies changed.

## Tests-first and regression findings

- Creation acceptance failed with the old extra Save/six-key actions, then passed with the three actions.
- Eight initial automatic-wiring cases failed for missing GPIO allocation, invalid existing pins and global output placement. Corrected behavior preserves valid pins, reserves encoders/disconnected manual nets, rejects invalid/conflicting/capacity cases atomically and keeps halves independent.
- Macropad, Corne42 and Lily58 at a 1u grouping grid pass actual-net and endpoint/rotated-label clearance checks. Finer grids may require manual grouping; automatic regrouping is deliberately excluded.
- Browser testing exposed a real cross-half key-move regression: deriving retained nets after changing half ownership could delete unrelated columns. A failing domain regression now protects deriving removed nets from the original project.
- An initial browser locator used `Auto assign` instead of the existing `Auto assign cells`; corrected before acceptance reruns.

## UI/UX review

Applied ui-ux-pro-max before and after implementation. Queries covered keyboard focus/modal behavior, React controlled dialogs, responsive button groups, consistent Tailwind button sizing, unobscured focus and actionable error recovery. Re-read quick-reference and canonical pro-rules. Native-only safe areas, haptics and Dynamic Type are inapplicable; no new palette, icons or animations. Existing Button sizing remains 32px, with placement-only width classes.

Rendered screenshots were inspected directly from isolated Playwright output. New actions have equal dimensions, a red Cancel, readable light/dark presentation and scrollable reflow at 640×500. Native keyboard Tab reaches each action and scrolls focused Cancel into view; Escape returns focus to New. The real automatic-wiring preview, inspected with existing pan/zoom, shows distinct D0–D4 labels outside the keys. Local review images are ignored artifacts in `.e2e-mutations/032-ui-review/`.

Resolved findings: UI032-01 extra creation actions; UI032-02 proposed-pin explanation/recovery; UI032-03 output/label clearance; UI032-04 split-move net preservation. No unresolved automated acceptance finding. Manual screen-reader speech, OS-originated settings and physical keyboard-only review have not been performed.

## Automated evidence

Checks ran against an isolated worktree containing only the staged 032 scope, excluding pre-existing Lily58/guideline changes.

- `make check`: passed, 206 test files / 1218 tests. Statements 91.70%, branches 85.41%, functions 92.48%, lines 91.67%; existing coverage floors unchanged. Architecture, guidelines, tooling, types, lint and format passed. Log: `/tmp/zmk-032-clean-check-final.log`.
- Final E2E-test adjustment passed types/lint/format: `/tmp/zmk-032-clean-static-final.log`.
- `make zmk-build`: passed all 32 actual-export targets and the intentional connector rejection. Pinned ZMK v0.3.0 SHA `edf5c0814fd3ea202e43aad2d68fd32e882a518c`. Log: `/tmp/zmk-032-zmk.log`. Existing fixtures cover matrix/direct/split/boards/keymaps/encoders; this does not assert firmware compilation for every newly unwired library preset.
- Three sequential isolated affected-journey runs passed 35/35 each without retries: `/tmp/zmk-032-clean-repeat-{1,2,3}.log`. Preview/Apply/Cancel, Undo/Redo, reload, JSON/ZIP, capacity errors and project creation covered.
- A final full browser attempt passed 158/161: three copies of one test refocused an already-focused Cancel after resizing, so native focus did not scroll again. Corrected the test to exercise actual Tab arrival through Create → Empty → Cancel, with no production change. The final native-size creation suite then passed 9/9 three consecutive times across Chromium/Firefox/WebKit: `/tmp/zmk-032-native-creation-{1,2,3}.log`.
- Final fresh complete `make test-e2e` passed **161/161 in 5.6 minutes** across Chromium/Firefox/WebKit after that test correction. Log: `/tmp/zmk-032-clean-e2e-corrected.log`. Byte-for-byte comparison confirmed all changed implementation/test files match the committed PR tree. Required CI also verifies the final commit.
- Controlled sensitivity ran alone: temporarily retained unassigned terminal pins after successful allocation. The browser acceptance test failed at the expected GPIO value (`0` versus empty), not a runner/build failure. Exact source bytes restored; subsequent automatic-wiring browser tests passed. Log: `/tmp/zmk-032-sensitivity.log`.

## Required outstanding gates

T015 is the manual accessibility pass required by `docs/guidelines/frontend/accessibility.md`, Testing. `docs/agent-rules.md` prohibits Computer Use/native app control without an explicit user request. No such control was used. The user elected to perform this manual pass personally on 2026-10-20; its result is pending. Before merge, complete this pass and require final-head main-based `check`, `e2e`, `image`, `mutations`, `zmk-build`; then verify the squash release at its exact merge SHA. CI/release evidence belongs to the PR and final delivery report.

## Limits

Automatic pins are proposed configuration, never detected hardware. No physical execution/flashing verified. Saved six-key projects remain compatible; only their product creation action is removed. Original 031/Lily58 and repository-guidance changes remain outside this scoped delivery.
