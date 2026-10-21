# 0020. One feature PR and asynchronous delivery

Status: Partially superseded by [0021](0021-selective-checks-and-pr-delivery.md) (delivery boundary and verification)
Date: 2026-10-20

## Context
The owner requests one PR per feature and no agent waiting for CI, to reduce token use and delivery time. Main currently enforces five CI checks, including for administrators; GitHub auto-merge is enabled.

## Decision
Partially supersede ADR 0019: keep a feature's spec, implementation, tests and verification in one branch/PR targeting main. Submit squash merge immediately after local acceptance using auto-merge when protected checks are pending. Do not poll or await CI/release workflows. Preserve branch protection, release labels, per-PR releases, local acceptance and explicit manual/review stops. Current rules live in `docs/guidelines/git-flow.md`.

## Consequences
GitHub completes the actual merge after required checks; the agent can finish once auto-merge is accepted. Reports distinguish pending CI/auto-merge from an actual merge or published release. Separate maintenance tasks may have their own PRs; feature stacks require an explicit user request.
