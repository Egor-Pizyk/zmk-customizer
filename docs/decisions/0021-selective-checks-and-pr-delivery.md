# 0021. Selective local checks and PR delivery

Status: Partially superseded by 0025 (local combined checks/browser expansion)
Date: 2026-10-21

## Decision

The owner requests one active feature, main-based branches, worktrees only when needed,
one PR per feature and stopping after PR creation. This supersedes ADR 0020's automatic
merge submission and older mandatory full/repeated local test runs. An urgent second
branch needs recorded justification; explicit user requests are also sufficient.

A dependency-aware changed-check runner verifies staged Git snapshots without stashing.
Global inputs and unknown impact widen selection; type and architecture graphs stay
whole. Full suites, coverage thresholds and browser matrix run in CI behind the existing
protected statuses. Coverage is reported in one updated PR comment using trusted code.
No new runtime dependency is introduced.

## Consequences

Local results describe the exact tree, not overall release readiness. CI remains mandatory
for main; manual acceptance is separate. Runtime UI dependencies require conservative
Chromium expansion. See the owning [Git](../guidelines/git-flow.md),
[testing](../testing.md) and [command](../commands.md) rules.
