# Remove picker category navigation — 2026-10-15

Scope: user-requested removal of tab-like category jump buttons above behavior and key choices. Group headings, all rows, search, keyboard navigation, docs links, binding-line slots and modifier toggles remain. Only choice-list.tsx changes in production; no domain, catalog, persistence or generator change, dependency or effect.

Resolved `006-action-panel-rework` using the Spec Kit resolver with an explicit directory override and no persistence; the stored selection pointed to unrelated feature 013. Read the owning spec, plan and tasks and amended US2 AS1–2 / FR-006 before implementation. Extension analysis: FR-006/FR-007/FR-012/FR-014 covered by T13–T15; no blocking consistency or principle findings, no unmapped extension tasks. Historical T12 described the superseded category-chip UI; modifier chips are a separate preserved control.

| Requirement / risk | Task / evidence | Observable assertion |
|---|---|---|
| FR-006: category controls remain in either picker | T13/T14 → tests/e2e/action-picker.spec.ts | Behavior and key picker regions contain no category navigation or tabs; sticky group headings remain visible |
| FR-007/FR-012: search or keyboard selection breaks | T13 → same E2E | BSPC search shows Editing/Backspace; ArrowDown focuses Backspace; Enter picks it |
| FR-014: wrong key edited, extra undo or persistence loss | T13 → same E2E | Saved Base/k0 binding becomes BACKSPACE; table displays Backspace; one Undo restores A |

The new test failed on the original category navigation (`navigation` count was 1 rather than 0), then passed in Chromium after removal. Existing application integration tests cover additional selection, slot, multi-key and clipboard cases. Final `make check` passed: architecture/guidelines, typecheck, E2E typecheck, lint, formatting and 176 Vitest files / 1037 tests with coverage floors intact. `make test-e2e` passed all 106 Chromium/Firefox/WebKit scenarios, including the production Docker build. Two further repetitions of the new scenario (`--repeat-each=2`, one worker, zero retries) passed 6/6 cases; together with the full run, the scenario passed three times sequentially per browser. `git diff --check` passed.

Manual screen-reader and actual browser 200% zoom checks were not performed; existing T11 stays open. No firmware build is needed for this UI-only removal. Existing unrelated checkout changes, including the preceding layer-bar work, were preserved.
