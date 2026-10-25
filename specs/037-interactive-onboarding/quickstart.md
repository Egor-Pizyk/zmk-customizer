# Future validation guide: Interactive onboarding

This is the acceptance procedure for the implemented feature. Actual executions, revisions and remaining manual limits are recorded in [verification.md](verification.md); this guide does not itself certify a pass.

## Setup

Use Node 24/Docker and commands in `docs/commands.md`. After implementation run `make up` for the development server, or the isolated production Playwright runner through changed checks. Use only disposable automated browser contexts; never clear a user's ordinary profile. Load a known nonempty project through the normal file picker for preservation scenarios. Preserve its saved JSON and add one edit with an undoable result.

## Journeys

1. Fresh context: open app, verify welcome once, exit, reload and verify no restart. New/imported projects must not reset the marker. Lower replay stays available in all workspaces.
2. Begin with existing project: start empty practice, verify visible tutorial label and original saved bytes unchanged. Make tutorial edits, Undo/Redo, exit/retain and verify exact original plus its pre-tour Undo/Redo. Resume explicitly. Reload during practice must open original without tour; resume again retains accepted tutorial edits.
3. Complete ordinary exercise: name project, use Add key and numeric positions or native pointer placement to make nine 1u keys 3×3; choose a supported board, diode direction, apply real matrix wiring, confirm six valid GPIOs, assign digits 1–9 on the base layer, view Problems, acknowledge firmware defaults, inspect file groups and complete discovery cards. Download the actual ZIP, unzip and compare paths/content to preview and independent expected matrix/keymap facts. The finish screen must follow successful browser handoff only.
4. Back/repair: return to an earlier step, Undo a required edit, verify no duplicate entities and no stale success, repair and continue. Cancel a wiring preview: it must not advance.
5. Error handling: invalid pin/partial binding blocks completion; navigate Problems and repair. Exercise storage unavailable/quota, corrupt/newer tutorial envelope, ZIP failure/retry and project change during ZIP build. Original data must remain recoverable, failed/stale export cannot complete the tour.
6. Repeat and adoption: restart after skip and after completion; confirm before deleting retained draft. Cancel adoption, then attempt failed/successful adoption. Only confirmed successful save replaces normal Project. Returning without adoption preserves original.
7. Keyboard/rendered review: complete all actions without pointer; inspect focus order/restoration and nested Escape, narrow panel, scrolling, missing-target Retry/Exit, light/dark, 200% text and reduced motion. Use actual VoiceOver/Safari or NVDA/Firefox for spoken step/progress/error and record manual limits separately.

## Checks and evidence

- Stage explicit implementation/test/documentation paths and run `npm run check:changed`; record the exact tree and log receipt in the single future verification.md journal.
- CI runs the complete Chromium suite and targeted Firefox/WebKit focus/geometry journeys. Run sensitivity regression alone under docs/testing.md; restore original bytes and record expected assertion failure.
- Add required new E2E to the suite; do not use force clicks, arbitrary sleeps, mocked core services or state-changing evaluate.
- Follow docs/commands.md for local build checks if any output changes. This plan expects no generator change; a firmware compilation is not implied by a passing UI export.
- Future tasks.md owns the single requirement → task → test/check → evidence mapping. Mark tests as passed only with actual results. The specification quality checklist is not implementation acceptance evidence.
