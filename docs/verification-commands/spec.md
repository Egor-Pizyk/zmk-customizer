# Verification command separation

Owner request2026-10-30. Refactor existing verification commands and cadence; no
product behavior, schema, dependencies or coverage floors change.

## Required behavior

- `check` / `check:static`: architecture, application/E2E types, lint and oxfmt
  (the repository formatter, no new Prettier dependency). No business unit/E2E runs.
- `test:unit`: all application and tooling unit tests, at a completed task item.
- `test:unit:changed`: staged snapshot's related application/tooling units, broad
  fallback for global/deleted inputs or unknown dependency impact. No static/E2E.
- `test:unit:focus`: explicit test file(s), optional test-name filter; reject empty
  or invalid targets rather than silently running all tests. For repairing failures
  observed in the full unit run, not routine per-edit execution.
- `test:e2e`: existing complete configured Playwright suite, explicitly at the
  feature/final commit boundary. Never implicitly from static/unit commands/hooks.
- `check:changed`: compatibility/static staged-snapshot command. Pre-commit runs
  only this static stage; caches are separate from unit and historical combined runs.
- Finish a logical module (files, imports, exports, callers, types) before static
  checking. Full units at task completion; E2E only at feature completion/final commit.
  Matrix/expected behavior before implementation remains; no mandatory premature red
  execution for incomplete imports/APIs. Diagnose actual failures with narrow reruns.
- CI retains architecture/tooling checks, unit coverage thresholds and browser matrix.

## Core behavior test matrix

| ID | Files | Main methods/commands | Condition | Expected result | Why correct | Wrong variant rejected |
|---|---|---|---|---|---|---|
| VC-01 | scripts/changed-check-plan.mjs; tests/tooling/changed-checks.test.mjs | changedCheckPlan | source, global, deleted files in static stage | No units/tooling/browser; static selected | Owner explicitly separates static from test execution | Previous production→all-Chromium expansion |
| VC-02 | scripts/run-changed-checks.mjs; tests/tooling/verification-stages.test.mjs | static worker | Complete module with runtime changes | Architecture/types/lint/format only | Static checkpoint must detect broken imports without running tests | Hidden unit/E2E subprocess |
| VC-03 | same worker/tests; tests/tooling/changed-check-fallback.test.mjs | unit worker | related/global/unknown impacts | Related or full units, no static/browser | Only unit stage may expand unit coverage | Global change implicitly starts Playwright; missing report silently skips units |
| VC-04 | scripts/check-changes.mjs; tests/tooling/focused-checks.test.mjs | snapshot/cache | Same staged tree, different stages, unstaged edits | Separate static/unit receipts; exact staged bytes, no index mutation | Static success proves nothing about unit success | Cache crosses stages or checks unstaged bytes |
| VC-05 | scripts/unit-test-focus.mjs; tests/tooling/unit-test-focus.test.mjs | unitFocusCommand | valid app/tooling file + optional name; empty/invalid target | Only explicit file/name; invalid input fails before runner | Focus is failure diagnosis, never an accidental full run | Empty target runs whole suite, tooling target dispatched to Vitest |
| VC-06 | package.json; .githooks/pre-commit; .github/workflows/ci.yml; tests/tooling/verification-stages.test.mjs | public scripts/hook/CI | User invokes each stage | Separate commands; no hidden E2E, CI coverage/tooling retained | User cadence plus preserved CI guarantees | check aliases full tests; coverage/tooling removed from CI |

## Work and verification

- [x] Update commands, staged runner/cache and explicit unit-focus dispatch.
- [x] Align workflow/testing/agent/preset templates and record the superseded policy.
- [x] Check completed logical module, run all units at this task boundary, use focused
      diagnostics only for actual failures, then run full E2E once at final completion.

Record actual commands, checked revision, rejected wrong variants and remaining
limits in verification.md. Tests target observable subprocess selection and results,
not just implementation names. No E2E application assertion is weakened.
