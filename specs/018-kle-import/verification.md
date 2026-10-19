# KLE import verification

Implementation started 2026-10-18; checks continued 2026-10-19. Feature remains in progress until broad verification gates are green. No commit was requested or created. The existing uncommitted 014–017 work was preserved on branch `018-kle-import`.

## SDD gates

- Feature resolver selects `specs/018-kle-import`; roadmap 017 was already recorded implemented, and 018 is the next listed optional product feature.
- Specification, assumptions/clarification, plan, research, import contract and requirement-linked tasks are present. Seven requirements have task/check coverage; no unresolved material questions or new dependency/schema decision.
- Spec-reviewer initially requested tests-before-parser ordering and immediate roadmap reconciliation. Both were corrected; independent re-review returned ready to implement.
- Spec-quality checklist passes. No extension hooks were configured.

## Implemented behavior and targeted evidence

- Storage accepts downloaded strict KLE JSON, validates known fields, decodes cursor/rotation clusters and one-key dimensions, and reports ignored metadata/legends/properties, primary-rectangle approximation and skipped decals. Independent fixtures match the existing six-key preset and exact cluster coordinates.
- Pure project replacement retains display name/controller, creates deterministic IDs and empty Base bindings, clears old wiring/advanced configuration, and uses existing autosave/history/validation without a migration.
- Schematic review is in the existing layout-action row. File errors/retry/cancel, byte/key limits, stale reads and review invalidation (including edit then Undo) are covered. Opening a project instead of finishing a KLE read clears the superseded read state.
- Apply/Cancel return keyboard focus to the labeled file input. A rendered regression was observed failing before this repair; final check covers the expanded assertion.
- Tests were authored before storage/domain implementation. Initial run failed on missing APIs. Location-path and superseded-read regressions were observed red before fixes.
- Focused unit/integration command (before the final focus-return amendment; final full check below covers the amended tests): `npm run test -- tests/unit/storage/kle/parse-kle-layout.test.ts tests/unit/domain/project/replace-project-layout.test.ts tests/unit/ui/integration/app-kle-import.test.ts tests/unit/ui/integration/app-project-files.test.ts tests/unit/ui/integration/app-files.test.ts tests/unit/ui/integration/app-layout.test.ts` — **45/45 tests, 6 files passed**, 4.67 s. Includes all 29 new import tests, exact old/new project history, reload and JSON round trip.
- Three sequential final browser baselines after focus-return repair: `npm run test:e2e -- tests/e2e/kle-import.spec.ts tests/e2e/accessibility.spec.ts` — **10/10 each**, 16.0 s, 15.7 s, 14.9 s, no retries or production edits/mutations between runs. Complete Chromium scenarios plus focused Firefox/WebKit. Browser webServer runs the production build.
- Controlled behavioral mutation (run alone after the earlier geometry baselines): replaced imported rotation with zero. Chromium KLE review journey failed at `kle-import.spec.ts:55` on the saved-key geometry equality, rather than a compiler/runner error. Exact original source bytes restored in finally. The focused unit run above and the final complete check passed after restoration.
- Existing file tests now select the project-file input specifically rather than the first JSON input. Existing accessibility E2E uses native `ControlOrMeta` select-all/Undo and macOS WebKit forward button navigation. Existing layout test waits for its deferred deletion focus before the following keyboard scenario. Assertions were preserved/extended.

## Broad gates and remaining work

- `make check` was attempted in Docker. Early runs exposed new-code type/lint/format issues and overly broad file-input test selectors; these were corrected. Docker later stopped responding; its pending task-owned CLI calls were terminated without resetting volumes, changing dependencies or restarting native apps.
- Equivalent host Node 24 final `caffeinate -i npm run check`: **passed, exit 0; 199 files / 1165 tests**. Architecture, guidelines, tooling, application/E2E typecheck, lint, format and every coverage floor passed. Coverage: statements 91.30%, branches 84.87%, functions 92.13%, lines 91.24%. Earlier runs experienced long wall-clock pauses and timeouts in unrelated/targeted UI files; final command temporarily inhibited idle system sleep without changing power settings. No timeout thresholds or coverage floors were relaxed.
- Final full browser command `caffeinate -i npm run test:e2e`: **127/134 passed, 7 failed**, 3.4 minutes, no retries. Includes complete Chromium and targeted Firefox/WebKit. All KLE scenarios passed. Failures: one existing Chromium rotated-preview snapshot (556 pixels, reproduced identically with the KLE control removed) and six WebKit Bindings layer-bar scenarios expecting the pointer-clicked Add layer button to be focused (three widths × two themes). These unrelated Bindings focus assertions have not been changed or weakened. The full browser gate remains open. Earlier Docker runs were interrupted by unavailable Docker; host accessibility shortcut portability issues were fixed and all changed accessibility/KLE journeys pass three times.
- Rotated-preview image differences were inspected; snapshot references and tolerances were not changed. A temporary attempt to run that test without the KLE control timed out starting its webServer, so it is **inconclusive**, not proof of a pre-existing defect. Source bytes were restored. A later valid isolated run reproduced **556 differing pixels with and without the KLE control** (same snapshot assertion); this establishes that the remaining snapshot mismatch is independent of the new control in this combined tree. Original source was restored exactly; references/tolerances remain unchanged.
- No ZMK syntax, catalog facts, generator format or schema changes. Actual firmware compilation was not rerun; unwired imported projects correctly remain blocked from ZIP export in browser tests.
- Manual keyboard/paint/zoom/contrast and screen-reader checks from docs/guidelines/frontend/accessibility.md were not performed. Browser automation does not substitute for them. Native app/CUA use was not requested.

## Browser risk coverage

| Scenario | Risk | Existing coverage | Added E2E | Visible assertion | Saved/exported assertion |
|---|---|---|---|---|---|
| Review/apply | Implicit data replacement or lost geometry | Project file/history and layout geometry suites | KLE review journey | Key count/warnings, actual SVG geometry | Exact saved keys and downloaded project JSON |
| Cancel/Undo/Redo/reload | Data/history loss | Existing project persistence | KLE review journey | Review clears, keys remain visible after reload | Exact old/imported project equality |
| Malformed/retry/stale review | Wrong input or late result overwrites edits | Project-file race contracts | KLE malformed journey; deferred-read unit contracts | Readable error/expired review, no apply action | Current project unchanged; edit/Undo preserved |
| Unwired layout | Misleading build readiness | Export validation | KLE review journey | ZIP download disabled | No invalid configuration downloaded |
| Keyboard/native input | Unreachable controls or incorrect focus | Accessibility suite | KLE keyboard apply across three browsers | Summary and apply work via keyboard | Same persisted geometry as pointer flow |
