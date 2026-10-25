# Standard keycap sizes — verification journal

Date: 2026-10-21. Branch: feature/012-standard-keycap-sizes. Base: `4561d78b7cb506cdd64ced4aefc78052b6d38786` (origin/main at branch creation). Scope: 012 FR-017–020; 004 standard-size amendment.

Pre-code consistency analysis: PASS. Finite catalog is an editing policy, not an import restriction; arbitrary Schematic geometry is preserved. Center anchor reconciles sizing with retained electrical contacts. No schema/generator changes, new dependency, new feature number or tutorial exists. Existing 012 pointer/numeric requirements continue in Schematic. Current Bindings has no resizing to remove. Source references and UI/UX guidance are in spec/plan.

Traceability: FR-018/019 → K002 → domain keycap-size tests; FR-017/020 → K003/K004 → keycap-size browser journeys; history/persistence/export/compatibility → K004 → downloaded JSON/ZIP and saved-state assertions; UI review/checks → K005. Manual OS/screen-reader acceptance → K006 remains pending.

Direct tests are justified for tests-first red observation and focused diagnosis; normal final verification uses check:changed. No real manual screen-reader/OS acceptance or firmware compilation is claimed. No ZMK syntax/output generator changed.


## Initial checks and post-implementation skill review

- Tests-first: stub setKeycapSize returned the original project; two behavioral domain tests failed (then 2/2 passed after implementation). Logs: /tmp/keycap-red.log and /tmp/keycap-unit.log. Initial missing-module failure was setup only, not counted as behavioral red.
- Focused diagnostic Chromium journeys: 7/7 passed, /tmp/keycap-browser.log. Tested real right-click, Shift+F10, native Escape/focus return, custom/mixed/current states, batch history, repeated current no-op/Redo, independent rotated corners, saved JSON and downloaded JSON/ZIP physical cells, reload and overlap export blocking.
- Post-skill invocation: `focus not obscured --domain ux`; reviewed quick-reference sections 1–3 and pro-rules.md. Native/mobile safe areas, Dynamic Type, authentication, images and haptics are inapplicable to this desktop web chooser. Desktop density and tokens remain the authority.
- UX-KS-01 — fixed: rendered review at 1024×600/light and 640×600/dark found the single-column list made the dialog unnecessarily tall. Switched to a two-column grid without changing target size; verified after the fix. Also corrected singular selected-key/status copy.
- UX-KS-02 — automated scope passed initially: names, pressed plus visible Current, custom/mixed feedback, cancel/focus return, outline visible, both-theme token rendering, dialog width contained, reduced motion. Final screenshots reviewed after UX-KS-01.
- UX-KS-03 — open/manual: actual OS keyboard, VoiceOver/NVDA, native browser 200% zoom not performed. 640px reflow is an automated proxy only. K006 remains open; PR will be draft.

- Updated focused browser suite after compact-grid fix: 9/9 passed (7 Chromium + native focus/export flow in Firefox and WebKit), /tmp/keycap-browser-final.log.
- Controlled regression: temporarily returned the original project instead of applying the computed size. Real Chromium journey failed on displayed-corner geometry; original source bytes restored in finally. /tmp/keycap-mutation.log. Initial attempt could not build because newly added Testing Library tests used Playwright-only `exact` role options; fixed test typing and repeated the probe. That infrastructure failure was not counted as mutation detection.
- Integration assertion uses 1e-12 tolerance for the independently expected −0.315u coordinate (binary float result −0.31499999999999995), avoiding rounding existing custom geometry. Saved snapshots/history remain deep-equal.


## Final automated evidence and delivery

Checked implementation commit: `a4690d5` (tree `2da556917ce3a6252c57a60813900259fc4b27d8`). `npm run check:changed` passed for the exact staged tree: whole-project typecheck, browser typecheck, architecture/guideline checks, changed-file lint/format, **222 unit files / 1290 tests** and **91 Chromium browser journeys**. Receipt and complete logs: `.check-logs/2da556917ce3-4561d78b7cb5/` (`passed.json`, `7-npm.log`, `8-npx.log`). Initial failed lint run (`7970201b90c8-4561d78b7cb5`) was corrected without disabling rules; split small local rendering helpers to retain function-size limits and fixed handler braces/options.

After the final rendering-helper changes, focused Firefox and WebKit native context/focus/history/export journeys passed **2/2** on the same implementation (`/tmp/keycap-engines.log`). Full cross-browser, coverage and CI status remain CI-owned and are not claimed here.

Rendered post-skill review: inspected all four actual Playwright screenshots (1024×600 and 640×600, light/dark, reduced motion). UX-KS-01 closed: all ten sizes and Cancel fit in the bounded two-column dialog; no label clipping. UX-KS-02 closed for the automated/rendered scope: visible focus, Current text plus pressed state, meaningful titles/labels, custom/mixed states, both-theme readability and unobscured controls. No new token pair introduced. The 640px case approximates reflow, not native 200% browser zoom. UX-KS-03 and K006 remain manual/open.

Source/schema/generator/dependency compatibility review: no project schema or migration changes, no generator syntax change, no new dependency; existing general Schematic sizing remains available and custom files are never coerced. Exported ZIP physical-layout cells were checked, but firmware compilation and hardware operation were not performed. Final diff inspected with `git diff --cached --check`; no generated artifacts included.

Delivery: dedicated branch, one draft PR to main with `release:minor`; no merge or CI polling. Documentation-only closeout follows the checked implementation in a separate commit; it changes evidence/task/roadmap status only. K005 covers automated implementation/review and prepared PR delivery; K006 remains open until actual manual evidence is supplied.

## User-reported manual acceptance — 2026-10-21

After PR #21 merged, the user confirmed in the 035 readiness conversation that the outstanding 012 manual checks (OS keyboard, screen reader and native 200% zoom) passed. This closes the manual acceptance task by user report; no new agent-observed manual run is claimed. Browser/OS versions and detailed speech observations were not supplied. Earlier open/manual statements above describe the historical delivery state.
