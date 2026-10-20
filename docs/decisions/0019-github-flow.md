# 0019. GitHub flow with stacked PRs and per-PR releases

Status: Partially superseded by 0020 (PR cardinality and synchronous CI/release waiting)
Date: 2026-10-20

## Context
The owner wants focused stacked PRs, autonomous merges after green CI and a release per PR. ADR 0006's single unprefixed branch per feature conflicts with that workflow. Native GitHub PR dependencies require explicit base management, especially after squash merges.

## Decision
Partially supersede ADR 0006's branch naming/cardinality only. Keep one immutable numbered specification directory per feature, with typed branches and focused PRs. `docs/guidelines/git-flow.md` owns the current workflow, read before starting and again before delivery.
Protect main for administrators too, require PRs and all five existing CI jobs, and allow squash merges without mandatory human approvals so the owner/agent can deliver independently. Keep dependency updates focused through Dependabot.
Release every PR when it reaches main using existing release labels/workflow. Features and significant fixes receive minor releases; small fixes, docs, tests and maintenance receive patch releases. This significant-fix rule is a deliberate local extension of SemVer.

## Consequences
Every intermediate main revision must pass CI and be safe to release. Required behavioral tests travel with implementation; independent coverage may be a later PR. Stack children are rebased/retargeted and rechecked before merging. Release completion is part of delivery.
