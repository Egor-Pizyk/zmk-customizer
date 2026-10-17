# Layer bar stability verification — 2026-10-15

Scope: the FR-001/FR-016 extension only. Existing unrelated work in the checkout was preserved. No domain, storage, generator or runtime dependency changes belong to this extension.

## Pre-implementation analysis

Resolved ownership with `SPECIFY_FEATURE_DIRECTORY=…/specs/007-layers .specify/scripts/bash/check-prerequisites.sh --paths-only --json`, then checked prerequisites with `--require-spec --require-tasks --include-tasks` and no persistence. The directory matches the requested layer UI. No extension hooks were configured.

The extension adds one refined requirement (FR-001), preserves keyboard behavior (FR-016), and has three linked tasks (T054–T056). Coverage: 2/2 affected requirements; no unmapped extension tasks, duplicated requirements, ambiguous acceptance criteria or blocking constitution/architecture findings. Existing T051 manual accessibility work remains open. Historical spec paths and schema versions describe the original implementation; this extension uses current module paths and makes no schema change.

## Evidence mapping

| Scenario / risk | Existing coverage | Extension task and check | Observable assertion |
|---|---|---|---|
| Layer count changes move editing controls and canvas | Existing layer operations and persistence tests; no browser geometry contract | FR-001 → T054/T055 → `tests/e2e/layers.spec.ts` | Exact Add layer, name field and panel bounds from 1 through 32 layers at 1024/1280/1440 px, light/dark |
| Overflow conceals the selected tab or moves keyboard focus | Existing tab semantic/keyboard contracts | FR-001/FR-016 → T054/T055 → same E2E | Selected tab fully in viewport; Add layer retains focus; Home/End focus, select and reveal endpoints |
| Long names increase tab width or reorder/delete loses the active layer | Existing domain layer identity and undo contracts | FR-001/FR-016 → T054/T055 → same E2E | Valid 19-byte wide-character label, full accessible name/title, unchanged panel bounds; rename visible in saved JSON; move/delete and Undo/Redo restore expected visible names/counts |

The regression first failed against the original layout: adding the third layer changed Add layer's x position from 394.140625 to 463.703125 px at 1024 px. This establishes sensitivity independently of the implementation. Later test setup corrections accounted for the existing name-size validation and dismissed the unrelated project-bar Redo tooltip before measuring page overflow.

Fixed-height navigation reserves space for classic scrollbars while overlay scrollbars may remain visually hidden according to OS settings. The selected-tab effect changes only the strip's `scrollLeft`; it never focuses a control or scrolls the document. Inline validation may grow the editing row, as before; the stability contract covers adding layers and valid names.

## Checks

Final `make check`: passed, including architecture/guideline checks, TypeScript, E2E typechecking, lint, formatting and 176 Vitest files / 1037 tests with coverage floors intact. `make test-e2e`: passed, 103/103 scenarios in Chromium/Firefox/WebKit; this includes the production Docker build and all 18 new layer cases. Initial focused Chromium run: 6/6 passed. Two further consecutive Docker layer-only runs passed 18/18 each. Together with the full run, all 18 changed scenarios passed three sequential runs without retries in Chromium, Firefox and WebKit. `git diff --check` also passed. Screenshots at 1024/light and 1440/dark were visually inspected for clipping, layout and selected state. Generated screenshots and reports remain ignored.

Manual limits: no screen-reader speech or actual browser 200% zoom check was performed; T051 remains open. No firmware build was needed because ZMK output is unchanged. Browser tests cover native focus and layout, not usability timing studies. An existing tooltip at the far-right project-bar Redo button can extend past the viewport while shown; it is outside this layer-bar change.
