# How work is done (Spec-Driven Development)

New capabilities and changes to user-visible contracts require a specification before feature code. Read only the artifacts needed for the current stage; reuse completed, current stages rather than restarting the workflow.

[Git flow](guidelines/git-flow.md) owns branch and delivery rules for every route below. Load the relevant section before a Git operation; reuse unchanged context under `AGENTS.md`.

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

## Frontend changes

Use the change route above and the affected feature requirements. There is no
mandatory before/after UI review, screenshot matrix, design checklist or manual
accessibility audit for every interface change. Perform a focused review only when
the user requests it or a concrete requirement, regression or unresolved risk needs it.
Existing keyboard/accessibility product contracts and automated regression coverage
remain in force. Record checks actually performed; do not add unperformed optional
reviews as completion blockers. This replaces generic review gates in older artifacts;
explicit task-specific acceptance requirements still apply.

## Stage gates

- Before planning: scope, non-goals and acceptance are clear; material questions are resolved.
- Before implementation: ensure testable requirements, an architecture-compliant plan, requirement/test coverage in tasks and resolved blocking analysis findings.
- Before completion: record requirement evidence, pass required checks, update task status and disclose material remaining limits.
- Amend missing requirements or changed contracts before expanding implementation. Code existing alone does not complete a task.

## Task brief and continuity

Use the request or existing feature artifacts for the observable goal, feature/FR/acceptance identifiers, scope/non-goals, preserved compatibility/Undo/export/accessibility contracts, verification assertions/commands/manual checks and material uncertainties. Do not add another brief when these suffice.

Keep exact relevant docs, contracts and owning modules in `plan.md`. Maintain one requirement → task → test/check → evidence mapping in tasks or verification. Add research, data-model, contracts or quickstart artifacts only for distinct useful content.

For resumption, handoff and revision-specific evidence, follow
[agent continuity rules](agent-rules.md#efficient-context-and-verification).
Reuse current feature artifacts and read changed or missing applicable sections.

## Local checks and delivery

Use the [focused diagnostic loop](testing.md#focused-diagnostic-loop) during
implementation: stage explicit paths, inspect `npm run check:focus -- --plan`, run
`npm run check:focus` and read its `summary.json` before full logs. Preserve the
tests-first requirements above. Focus receipts cannot satisfy the mandatory final
`npm run check:changed` gate. Use [commands](commands.md) for snapshot checks and CI
scope, and [agent rules](agent-rules.md#efficient-context-and-verification) for the
single revision-specific journal. [Git flow](guidelines/git-flow.md#deliver) owns
delivery: open/update one PR and stop unless separately authorized to merge.
