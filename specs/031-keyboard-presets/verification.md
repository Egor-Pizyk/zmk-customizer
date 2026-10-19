# Verification — 2026-10-19

## Scope

031 adds 11 offline layout presets to New, QWERTY/empty bindings, SVG and per-key geometry review, explicit setup guidance and safe creation through existing New replacement. Existing complete six-key starter remains available. No schema/dependency/generator change. Corne clearance adaptation and pinned split provenance are recorded in research.md.

## Evidence so far

- Before implementation, new domain/catalog tests failed because KEYBOARD_PRESETS/createLayoutPresetProject did not exist: `/tmp/031-red.log` (five failures). Catalog keycode/count/schema errors were then repaired; later geometry invariant test detected actual Corne rectangle overlaps, fixed in the catalog without weakening validation or altering upstream fixtures.
- Read-only spec-reviewer found a missing exported-geometry compile gate; plan/tasks amended to require make zmk-build. Re-review returned ready; final clearance-adaptation review found no blockers. Requirement quality checklist passes 16/16. Analysis covers FR-001–007 and SC-001–004 without unmapped requirements; task mapping is maintained only in tasks.md.
- Focused Vitest: 19/19 passed (17 domain/catalog cases and two rendered real-App flows), `/tmp/031-focused2.log`. Asserts all counts, valid pinned keycodes, modes, independent project instances, storage round trips, exact edit history, cancellation and starter preservation. Every library layout passes name/binding/geometry validation; only expected unwired contacts remain.
- Initial native-browser failures were test locator ambiguity and trying to pointer-check a visually hidden radio. Select now uses exact native combobox role; radio uses focus/Space. No force clicks, state injection or core mocking.
- Focused Playwright: 7/7 passed in Chromium/Firefox/WebKit, no retries, `/tmp/031-browser3.log` (36.6s). Asserts saved half IDs, rotated Corne geometry, preview/cancel and native focus return, downloaded/reopened JSON, reload, edit Undo/Redo, incomplete ZIP guard and complete starter ZIP content.
- Reviewed actual 720×700 Chromium Sofle preview screenshot: dialog/labels/preview/actions visible and readable; `.e2e-mutations/031-preview/sofle-narrow.png`. This is automated screenshot review, not a manual accessibility audit.

## Completion checks

- `make check`: exit 0, **205 Vitest files / 1203 tests passed**, all static/tooling checks and coverage floors passed; `/tmp/031-check-final.log`. Global coverage: statements 91.54%, branches 85.22%, functions 92.34%, lines 91.52%.
- `make zmk-build`: exit 0, **32 actual-export targets compiled**, resulting configuration assertions passed and intentional invalid-connector build was rejected for its intended reason; `/tmp/031-zmk.log`. Runner pins ZMK v0.3.0 `edf5c0814fd3ea202e43aad2d68fd32e882a518c`, Zephyr 3.5 and official SDK/image. Firmware artifacts/config/DTS under ignored `.zmk-build/artifacts/`.
- `make test-e2e`: exit 0, production build succeeded and **146/146 browser tests passed**, no retries, **6.8 minutes**; `/tmp/031-e2e-full.log`. Includes complete Chromium suite and focused Firefox/WebKit, including existing modal/native-focus regressions. Vite retains the existing large-bundle warning.
- Controlled saved-half mutation ran alone after full checks/builds. Temporarily forced all created keys to half `left`. The Chromium creation test failed the intended persisted-project assertion: expected 21 left keys, received 42. The runner required that behavioral assertion and exit 1, rather than accepting compilation/runner failures. Source restored byte-for-byte, SHA-256 `75d1ecde02a3a4d10998eb0e96786ff5fbf1ebf99beb8c1622e57efbd49f0b26`; `/tmp/031-mutation.log`, ignored `.e2e-mutations/031-lost-half/{output.log,results,report}/`.
- Three sequential preset-only runs after restoration: **7/7 each**, no retries, **26.3s / 26.3s / 26.1s**, exit 0 for the whole ordered sequence. Logs `/tmp/031-repeat-{1,2,3}.log`; isolated reports/screenshots under ignored `.e2e-mutations/031-repeat-{1,2,3}/`. No intervening production/test changes.
- Final `git diff --check` passed; feature Markdown links resolve; source hash after all repeats matches the restored baseline. Roadmap/index/spec/tasks reconciled, pre-existing roadmap edits preserved. T001–T007 complete; T008 intentionally remains pending because manual accessibility was not performed.

## Limits

No manual mouse-unplugged pass, screen-reader speech test, OS theme/contrast audit or hardware test has been performed. T008 remains unchecked. Automated focus/keyboard/reflow and screenshot review do not establish those results. No onboarding update is needed: feature 032 is not implemented. Layout-only presets deliberately have no actual wiring/pins/diodes; firmware compile checks apply to the runner's configured export fixtures, not all unconfigured library layouts.
