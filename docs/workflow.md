# How work is done (Spec-Driven Development)

New capabilities and changes to user-visible contracts require a specification before feature code. Read only the artifacts needed for the current stage; reuse completed, current stages rather than restarting the workflow.

Before creating a feature or branch, read [Git flow](guidelines/git-flow.md). Re-read it after verification and before committing or delivering work; its single-PR, release and PR-delivery rules apply to every route below.

## Choose the change route

| Change | Required route |
|---|---|
| New capability / changed product contract | Full Spec Kit flow below |
| Extension of an existing feature | Amend its affected requirements, plan and tasks, then analyze and implement |
| Bug against an existing requirement | Cite the requirement; reproduce a failing regression, fix the owning layer, record verification. Amend artifacts if a requirement or task was missing |
| Refactor with unchanged behavior | Record scope, preserved contracts, implementation tasks and verification in the owning feature; a separate spec is needed only for a distinct feature/change initiative |
| Documentation / analysis | Edit or report directly; verify content, links and instruction consistency. No product test run is required for prose-only changes |
| Dependency / tooling maintenance | Use focused scope and checks; add an ADR when dependency policy or another accepted decision changes. A new developer capability follows full SDD |

Do not use the smaller routes to hide new behavior. For mixed work, apply the stronger route to the affected behavior. Tests-first is mandatory for domain, storage and generator behavior, and for bug regressions. UI testing and browser gates are owned by `docs/testing.md`.

## Full feature flow

1. `/speckit-constitution` — initialize or amend only when principles change; project principles come from `docs/principles.md`.
2. `/speckit-specify <feature>` — what and why, no implementation design. Creates `specs/NNN-name/spec.md`.
3. `/speckit-clarify` — resolve material uncertainty before planning.
4. `/speckit-plan` — how, applying architecture and tooling; list task-relevant context.
5. `/speckit-tasks` — requirement-linked tasks, tests before their implementation.
6. `/speckit-analyze` — consistency across spec, plan, tasks and project rules.
7. `/speckit-implement` — execute tasks and maintain their status.
8. Verify and record evidence using `docs/testing.md` and `docs/commands.md`.

Feature order and initial scope: `docs/roadmap.md`. Approved feature specs capture refinements; if roadmap and spec disagree, reconcile the affected entry instead of enforcing stale scope. One new feature = one `specs/NNN-short-name/` directory and one branch and one PR under [Git flow](guidelines/git-flow.md), containing the spec, implementation, tests and verification together. Existing directory numbers are immutable and never reused.

Resolve the feature using the installed Spec Kit scripts when invoking its commands. Verify the selected directory against the user's task; persisted `.specify/feature.json` is selection state, not evidence that a feature is active or complete.

## Frontend UI/UX workflow (Codex)

For every task that creates or changes an interface, interaction or visual styling, define the expected UI/UX outcome before implementation and review the rendered result afterward. Use project conventions, existing components, semantic tokens and accessibility rules.
1. **Before creating or changing UI:** describe how the interface should work and look. Check design choices against existing components, semantic tokens, accessibility rules and the user's scope. Describe the flow, information hierarchy, controls, layout, relevant empty/error/disabled states, feedback, keyboard/focus behavior, supported themes, responsive behavior and reduced motion where applicable.
2. **Write the result before code:** add the accepted user-facing UI/UX requirements and testable acceptance scenarios to the owning `spec.md` before planning or amending the implementation plan. Put implementation choices (component reuse, token mapping and technical layout approach) in `plan.md`, and link implementation/review tasks in `tasks.md`. For existing work, amend affected artifacts rather than restarting completed stages. For a bug or behavior-preserving refactor, record the expected UI outcome against the existing requirement and amend the spec only where it is missing or changes. Record rejected or inapplicable recommendations briefly in the plan; generated suggestions do not become requirements automatically.
3. **After creating or changing UI:** compare the implemented result with the specification and run the applicable UI/UX review in [testing.md](testing.md). Fix findings within scope, repeat the affected checks after fixes, and record findings and actual evidence in the feature's verification artifacts. Specify a changed contract before expanding implementation. Unresolved acceptance failures block completion; record unperformed manual checks and remaining limits explicitly.

Use the existing feature artifacts for these results; do not create a competing design-system source of truth or blindly persist generated recommendations. Preserve project compatibility, Undo/Redo, deterministic exports and repository dependency/offline rules. Design guidance is not proof that the rendered interface passes review.

## Stage gates

- Before planning: scope, non-goals and acceptance scenarios are clear; material open questions are resolved.
- Before implementation: frontend work has completed the UI/UX design and specification step above; requirements are testable, plan respects architecture, tasks cover requirements and appropriate tests, and blocking analysis findings are resolved.
- Before completion: frontend work has completed the post-implementation UI/UX review with recorded findings and evidence; affected requirements have evidence, required checks passed, task status is accurate, and unverified/manual checks and remaining limits are explicit.
- If implementation reveals a missing requirement or changes a contract, amend the relevant artifacts before expanding implementation. Do not check off work based only on code existing.

## Task brief and continuity

Capture these in the user request or existing feature artifacts; do not create another document when those already suffice:

- Goal: the observable result and why it matters.
- Basis: feature directory and relevant FR / acceptance scenario identifiers.
- Scope and non-goals: what this change includes and excludes.
- Preserved contracts: data compatibility, undo/redo, export, accessibility as applicable.
- Verification: observable assertions, commands and manual checks.
- Uncertainty: material questions versus implementation choices the agent can decide.

In `plan.md`, keep a short Relevant context section with exact docs, contracts and owning modules. Link requirement → task → test/check → evidence in tasks or verification; maintain one mapping, not duplicate tables across artifacts. Research, data-model, contracts and quickstart files are needed only when they carry distinct useful content.

For a resumed session, read the relevant spec, plan and pending tasks, inspect the actual diff, and use recorded evidence with its date/scope. Historical success is not a check of the current tree.

## Local checks and delivery

Use the changed-check script for local verification; full suites and coverage gates
run in CI. Direct test commands are reserved for diagnosis or justified necessity.
Record one task journal with the checked SHA/tree digest and actual outcomes, linking
from other artifacts. Open one PR and stop; do not auto-merge or wait for CI. See
[Git flow](guidelines/git-flow.md) and [commands](commands.md).
