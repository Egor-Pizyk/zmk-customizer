# 0025. Separate static, unit and final browser verification

Status: Accepted
Date: 2026-10-30

## Context
The owner requests separate commands and module/task/feature execution checkpoints.
The old changed-check runner starts full Chromium for each production checkpoint.

## Decision
Partially supersede ADR0021's local combined-check/browser-expansion policy and
ADR0018's execution timing: behavior/test contracts first, no required premature red.
Static check covers architecture/types/lint/format after a complete module and imports.
Full application/tooling units run at task completion; changed-unit selection is an
explicit unit-only tool. Focused units diagnose a failure from the full run.
Full configured E2E runs explicitly only at feature/final commit completion.
Pre-commit/check:changed verify static staged bytes only, with stage-specific receipts.
Unit/static commands never launch browsers; test evidence cannot cross stage caches.
CI preserves full coverage thresholds, tooling checks and its browser matrix.

## Consequences
Update workflow, agents, preset/templates and Makefile consistently. Old combined
receipts cannot satisfy new stages; intermediate commits do not start browser suites.
Contracts/matrices, independent expected results and honest sensitivity evidence stay.
No runtime dependency, product behavior or application test assertion changes.
