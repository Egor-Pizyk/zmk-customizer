# Firmware overflow repair — 2026-10-25

Bug route: shell FR-001/FR-006, FSO-1–3. Resolver selected 036; inspection identifies shared shell 001 as owner, not new onboarding. Isolated fix worktree from origin/main 53ca1c0 preserves unrelated staged audit edits and open onboarding work; acute user-reported regression justifies separate repair branch.

Direct Playwright runs are required for tests-first layout diagnosis. Red: both Chromium viewport cases fail: document height 3740px at width 1024 and 2632px at width 1440 instead of 800px. Logs: `.check-logs/firmware-red.log`.

Risk → coverage: long settings overflow → native wheel over navigation, stationary sidebar/document, actual last setting reachable; empty search → visible empty result. No project mutations in this presentation-only journey; saved/exported data covered by existing Firmware journeys.

FSO-2: `main` lacked a positioned containing block: absolute screen-reader descriptions escaped its scroll clipping. Adding `relative` contains them within the existing scroll owner. Chromium red/green verified at both widths; screenshot review confirms sidebar, project bar, bottom settings and footer remain correctly placed. Firefox wheel input advances in bounded increments, so bottom reachability retries native wheel input until the last setting is visible. Checked executable revision a131992, tree `6b8dd77f7abc58194cdd80ce0c948c4439eef5f6`, base `53ca1c0`. `npm run check:changed` passed: typecheck, E2E types, architecture, guidelines, lint/format, 114 related unit tests and all 125 Chromium journeys (3.0m). Receipt/logs: `.check-logs/6b8dd77f7abc-53ca1c073e83/`. Final Chromium journey includes dark 1024px and light 1440px. Focused cross-browser diagnostic: 6/6 passed on Chromium/Firefox/WebKit at both widths before the final theme-only test addition; `.check-logs/firmware-final.log`. Initial local lint failure (numeric separator in test delta) corrected before final checks.

Rendered finding FSO-UI-1 resolved: long-form accessible descriptions no longer escape main; actual bottom-of-list screenshot reviewed at 1440px/light, with stationary sidebar/project bar, reachable final setting/footer. Browser assertions cover dark/narrow geometry, native wheel input and empty search. Existing Firmware cases cover persisted settings/Undo/exports. No new tokens, controls, motion, schema or dependencies; contrast redesign and firmware builds inapplicable. Manual keyboard-only/OS/screen-reader acceptance remains outstanding; deliver as draft. OS/screen-reader manual acceptance unperformed.


## Pre-major sweep continuation — favicon

User requested all fixes on `fix/pre-major-sweep`; Firmware commits were cherry-picked as b16a5c4/b5d7a5d. Main working folder is now on that branch; unrelated staged audit documents remain excluded from repair commits. Resolver has no selected feature in this worktree; shell 001 owns the repairs.

FR-041 → FAV-1/2/3 → tests/e2e/favicon.spec.ts. Red production Chromium test failed on absent icon declaration (`.check-logs/favicon-red.log`). Added explicit SVG declaration and local public/favicon.svg; no prior favicon asset exists in repository history. Browser test verifies same-origin SVG response/type, first load/reload and rendered SVG. Direct all-engine runs supply rendered evidence: 3/3 Chromium/Firefox/WebKit passed (`.check-logs/favicon-render.log`); actual 32×32 screenshot reviewed, keyboard silhouette and white keys legible on solid blue. Browser chrome itself is outside Playwright screenshots; no claim of manual tab-chrome or screen-reader acceptance.

`npm run check:changed` passed tree `4d6137999050878553c42070f9b93456c99834d2` against b5d7a5d: typecheck, browser types, architecture, guidelines, focused lint/format and Chromium favicon test. Logs/receipt: `.check-logs/4d6137999050-b5d7a5d08eb8/`. This snapshot also contains pre-existing staged documentation; commit excludes it. Hook checks the exact selected commit tree separately. Prior Firmware evidence above applies to unchanged executable files; favicon adds no project or generated-output changes. Final reporting edits receive hook checks. Existing manual acceptance limits remain.

User refinement: favicon must depict a green keyboard as before. Updated keyboard chassis to green with transparent outer background; same loading/reload contract. Rendered review and hook checks recorded by follow-up commit.


## Main synchronization and Keyboard shortcuts — 2026-10-25

User authorized preserving eight pre-existing staged audit documents in separate commit 873be77, then merging origin/main 9f842d8 (onboarding). Resolve roadmap/spec index with current main content and app with BOTH onboarding target and relative main scroll containment. Favicon/Firmware fixes preserved. No onboarding learning steps/targets/text change is needed for help-dialog sizing; launcher and existing shortcut content remain unchanged.

FR-040/FR-032 → KSH-1/2/3 → tests/e2e/shortcut-help.spec.ts. Red: horizontal overflow reproduced in all six Chromium width/theme cases before fix (`.check-logs/shortcut-red.log`). Fix: existing wide Dialog size, bounded table columns, wrapped key descriptions. Final focused run: 18/18 passed in Chromium/Firefox/WebKit at 640/1024/1440px, both themes (`.check-logs/shortcut-verified.log`). Includes lower Pointer rows, no container/cell overflow, Escape and focus return. Firefox inline kbd clientWidth=0 is excluded from scroll-container measurements; containing cell still checked. Rendered 640px/dark screenshot reviewed: legible wrapped content, close button, bounded vertical scrolling, no horizontal scrollbar. Native manual screen-reader/OS acceptance remains unperformed.

Initial merge check needed one formatter cleanup in app conflict resolution. Static/tooling/full unit stages passed; browser run invalidated by overlapping diagnostic runs sharing test-results mounts (ENOENT trace artifacts). Isolated layer diagnostic passed. This was a verification orchestration error, not a reason to change product or assertions. Final combined snapshot runs alone; results pending.
