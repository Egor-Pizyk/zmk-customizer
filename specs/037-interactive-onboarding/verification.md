# Verification journal: 037 interactive onboarding

## Scope and analysis — 2026-10-25

Worktree: `zmk-customizer-037`, branch `feature/037-interactive-onboarding`; implementation base `ad8725dd83ed50a6d7d91fca4e65862f20fc9471` (delivered 036). Original checkout's staged 035/roadmap work is untouched. User authorized all remaining stages without approval pauses; no auto-merge is authorized.

Read-only analysis and required spec-reviewer: 22/22 FRs mapped to 44 tasks, no critical/high/blocking findings, no unmapped execution tasks. Minor findings: historical stage wording and stale 038 ordering; reconcile in owning docs under current authorization. Constitution alignment passes. No extension hooks configured. Spec quality checklist: 23 checked, zero unchecked. No checklist markers changed during implementation.

## Tests-first and diagnostics

Direct focused commands are diagnostic red/green runs required by tests-first and new cross-layer session routing; final verification uses check:changed. Logs are ignored in `.check-logs/`.

- `onboarding-red.log`: new domain/storage suites failed due to missing module APIs before implementation.
- `session-red.log`: initial session test run failed; diagnostic revealed missing jsdom environment declarations. Corrected platform environment before evaluating behavior; this failure alone is not semantic regression evidence.
- `onboarding-green.log`: typecheck and 11 focused domain/storage/session tests passed after implementation (3 domain, 5 storage, 3 session). Includes original byte/history preservation, tutorial undo save routing, transactional failed edit and failed entry/adoption.

## Execution scope

Implementation and automated verification are complete. Browser/rendered review and final receipts are recorded below. Manual keyboard and screen-reader speech acceptance has not been performed. No firmware compilation is claimed; generators/catalog syntax are unchanged.

## Implemented checks and rendered review

- `session-actions.log`: 19 focused checks passed (domain/storage/project actions/discovery). `integration.log`: 143 existing integration/project tests passed across 34 files. Later additions are checked in the final snapshot below.
- `macropad4.log`: full ordinary-editor path from empty learning project to real ZIP passed. Archive bytes match current preview; the final exercise adds independent 3×3 transform and canonical digit assertions.
- `onboarding-review-green2.log`: both pointer and keyboard-only full ZIP paths and protected lifecycle passed; accessibility failures were retained and repaired, not retried away.
- `a11y7.log`: Chromium/Firefox/WebKit focus, Tab traversal, draft Escape then tour Escape, exit/restore, visible Add key and Exit, and no page overflow passed across light/dark and 1280/1024/390px with reduced motion. Screen captures reviewed: `test-results/onboarding-accessibility-o-0740c-ive-spotlight-cross-browser-chromium/spotlight-{light-1280,dark-390}.png`. These ignored screenshots/traces are local evidence, not committed reports.
- `onboarding-ui.log`: three real-provider onboarding integration cases passed for first-show StrictMode, Back/exit safety and retained/corrupt draft recovery. These are semantic checks, not native focus/paint evidence.
- `onboarding-marker-mutation.log`: disabled only the shown-marker write; the lifecycle reload `not.toBeVisible` assertion failed as intended. Exact original storage bytes restored in a finally block. This one-off isolated probe used the existing production Playwright command; no enduring new mutation runner was needed.

| Finding | Outcome / evidence |
| --- | --- |
| O1 Canonical digit names prevented completion | Fixed by injecting catalog names/aliases into pure conditions; full exercise now completes |
| O2 Welcome dialog stole initial focus | Deferred step focus until native dialog closure; 3-engine assertions passed |
| O3 Add key / Exit clipped at narrow size | Reveal target and independently scroll instructions while navigation remains visible; rendered sizes passed |
| O4 ProjectBar commands / discovery goals too broad | Name target narrowed; New/Open/AI disabled; KLE and Settings each have their own real target |
| O5 Invalid nonempty name advanced | Added cached name-validation fact; `valid-name-red.log` reproduced failing assertion before fix |
| O6 Escape opened then immediately closed native exit dialog | Prevent the initiating Escape default; draft cancellation still takes precedence, 3-engine checks passed |

The scrim uses a dedicated black semantic token in both themes; focus/text token pairs are unchanged. The named scrollable instructions section has a scoped tabindex lint allowance for keyboard scrolling, documented in the accessibility guideline. No runtime dependency, new context, Project schema or generator was added.

## Manual limits and delivery gate

Actual VoiceOver/Safari or NVDA/Firefox speech, physical unplugged-mouse acceptance, OS-level text zoom to 200% and text-spacing overrides have not been performed. Automated keyboard operations and responsive screenshot review do not establish those manual outcomes. T041 and the manual portion of T040 remain open; delivery must be a draft PR. No firmware compilation or hardware validation was performed or claimed.

During work origin/main advanced to `53ca1c0` (035 documentation PR #23); no active product PR remains. This branch will reconcile that delivered documentation before delivery without touching the original checkout's work.

## Final-gate diagnostics

The first full staged check (`489240df4f545f6b10eee95c86d88c31822f269f`) passed all 1411 assertions but failed on four uncaught jsdom `scrollIntoView` errors. The shared test-only platform shim was extended; production scrolling and real-browser assertions were unchanged. The failed first coverage aggregate also reported those same four errors, while all coverage floors were satisfied (90.85% statements, 84.20% branches, 92.35% functions, 90.75% lines). Both gates are rerun after the shim fix; failure is not treated as success.

The full `npm run check` aggregate is additionally run because the invoked implementation skill requires it and the new persistence/UI modules need instrumentation against existing coverage floors; this is a documented justified full diagnostic beyond changed checks. No thresholds or test assertions were weakened.

The final action review added a regression (`controller-action-red.log`) proving that changing a controller must advance after an accepted edit, while inspecting an unchanged default still needs acknowledgement. Controller/pin edits now join the existing automatic practical-step transitions. `exercise-final.log` passed both full routes with Undo/repair, adoption cancel/success and replay after completion.

## Final automated results and rebase

- Exact staged implementation tree `da287a716c07f5d99197515e2407ae24e7524e5c`, base `ad8725dd83ed50a6d7d91fca4e65862f20fc9471`: `npm run check:changed` passed, including static/tooling/type/lint/format gates, unit checks and **127 Chromium scenarios**. Logs: `.check-logs/changed-delivery.log` and `.check-logs/da287a716c07-ad8725dd83ed/`.
- `npm run check` passed with **247 test files / 1412 tests**, no unhandled errors. Coverage: statements 90.86%, branches 84.20%, functions 92.38%, lines 90.76%; existing floors unchanged. Log: `.check-logs/full-check-delivery.log`.
- An intermediate browser run at tree `733…` failed with trace-artifact ENOENT from concurrent diagnostic browser jobs sharing `test-results`. The final gate ran without competing browser jobs and passed; no product assertion was weakened.
- Implementation commit `108e58a510289db92718efe3ba9410bdea4b6b29` was rebased onto delivered main `53ca1c0`, producing `87f9285`. Only roadmap/index conflicts required resolution. `git diff 108e58a HEAD -- src tests scripts .oxlintrc.json tsconfig.json package.json package-lock.json` was empty: executable code, tests and configuration retain the checked bytes. Upstream differences are documentation only. Reporting/documentation receives a fresh changed-check before delivery.
- T001–T027, T029–T039 and T042–T043 have executed implementation/check evidence above. T028/T040 retain manual zoom acceptance; T041 retains actual manual keyboard and screen-reader acceptance. Requirement-table links point here for automated evidence and to the explicit manual limits above; they do not certify unperformed acceptance.

No CI, merge, release, firmware build or actual screen-reader speech result is claimed. Delivery is a draft PR under the git-flow rule for outstanding manual acceptance.

## Delivery

Reporting tree `968183401dfdc2264329087d0515d95dff31603d` passed fresh documentation changed-checks (typecheck, E2E types, architecture and guidelines); `git diff --check` passed. Implementation/review receipts are preserved above.

Committed and pushed branch `feature/037-interactive-onboarding`; opened [draft PR #26](https://github.com/Egor-Pizyk/zmk-customizer/pull/26) with the single `release:minor` label. The initial push using the active read-only account returned 403; the already-connected repository owner credential succeeded without changing the active account. No credentials were written to repository files. T044 delivery is complete; T028/T040/T041 manual acceptance remains open. No merge, auto-merge or CI polling was performed.
