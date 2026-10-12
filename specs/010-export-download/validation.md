# Validation record — 010

Date: 2026-10-12. Branch: 010-export-download. Existing 008/009 uncommitted work preserved. No commit, deployment, publication or firmware build.

## Spec Kit gates

Completed specify → clarify (no critical ambiguities; release resolved from pinned docs, workflow default documented) → plan/research/data-model/contracts/quickstart → tasks → analyze → implement. Quality checklist 16/16 passed. Analysis: 10 functional requirements, 14 tasks, 100% requirement coverage, zero critical/high/medium issues. Coverage: FR001–004 T004–009; FR005 T006–007; FR006/008 T008–009; FR007/009 T002–003/T010–011; FR010 T006–009/T013.

Spec-reviewer: ready to implement, minor direct plan-source link corrected. ZMK-reviewer: approve, no findings; pinned layout, manifest/workflow refs and board target checked, golden test passed. No extensions.yml hooks installed.

## Tests first and implementation

Browser adapter tests failed before module existed, then passed. Independent repository goldens copied only from approved 009 expectations and authored pinned-template support text before the composition generator; tests failed before generator existed. ZIP tests failed before ZIP adapter existed, then passed extraction, order/clock determinism and exact DOS metadata. UI tests failed on missing handler, old five-file preview, missing disabled state/actions, then passed. Single-file handler tests observed failure before implementation.

Added approved fflate 0.8.2 and lockfile through Docker. Deferred zipSync avoids Blob workers blocked by current CSP; sorted flat paths, local-calendar constant timestamp, fixed compression/OS/attributes. Schema remains 4; no project/state/history changes. Export UI split into small toolbar/preview and pure composition query after lint review.

## Browser verification

CUA Chrome verification completed. Existing saved project was not replaced; invalid-project Export showed disabled Download .zip and Fix 10 problems to download, with no preview. Valid tests used a separate incognito session and new disposable six-key preset.

- Preview exposed all ten files and labeled copy/download controls.
- Browser ZIP saved as ~/Downloads/zmk010-verification-full.zip: Python ZipFile extraction matched all ten independent golden paths/content byte for byte; all entry dates 1980-01-01 00:00:00.
- Second browser download ~/Downloads/zmk010-verification-repeat.zip was byte-identical to the first.
- Workflow unchecked removed its preview and ~/Downloads/zmk010-verification-no-workflow.zip matched the exact nine-file golden subset.
- Copy config/west.yml showed visible and announced success. Single-file save dialog used west.yml basename; saved verification file bytes matched expected config/west.yml.
- Keyboard Tab and Space reached/toggled workflow checkbox and restored its preview. Dark-theme screenshot inspected: readable content, visible checkbox focus, file actions fit within workspace.
- Reload preserved preset and default workflow choice. Dev Vite initially served stale catalog content despite current files; restarted existing app service and verified workflow explanation and exact docs link appeared.

## Final checks

Required make check passed: synchronized agent mirrors, TypeScript, lint zero errors/warnings, format check, **126 test files / 780 tests**. Production build passed; existing bundle-size warning remains (>500 kB). Final check after UI text regression assertions and documentation updates also passed: **126 test files / 780 tests**, lint zero errors/warnings, typecheck and format passed; production build passed (600.78 kB JS / 175.60 kB gzip). git diff --check passed.

## Limits

No firmware compilation was executed; this feature prepares the configuration for external builds. Offline behavior is supported by local adapters and source review (no runtime networking) but network-disabled browser run was not executed. Clipboard denied/unavailable, export failure/retry, snapshot and duplicate-click paths are automated tests. Full light-theme/1024px/screen-reader audit was not executed. Browser downloads cannot detect a user canceling the browser save dialog, so feedback correctly says Download started.
