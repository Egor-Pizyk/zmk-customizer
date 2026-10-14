# How work is done (Spec-Driven Development)

Features are built through GitHub Spec Kit. Do not write feature code without a spec.

1. `/speckit-constitution` — once; project principles (source: docs/principles.md and docs/agent-rules.md).
2. `/speckit-specify <feature>` — what and why, no tech. Creates `specs/NNN-name/spec.md`.
3. `/speckit-clarify` — resolve open questions before planning.
4. `/speckit-plan` — how, using docs/architecture.md and docs/tooling.md.
5. `/speckit-tasks` — ordered task list with tests first.
6. `/speckit-analyze` — consistency check spec ↔ plan ↔ tasks.
7. `/speckit-implement` — execute tasks, including Playwright coverage for changed user journeys (docs/testing.md).
8. Verify completion — `make check`, production build and `make test-e2e`; record results and coverage limits in feature artifacts (docs/testing.md).

Feature order and scope: `docs/roadmap.md`. One feature = one branch `NNN-short-name` = one `specs/NNN-short-name/` directory. Numbers are immutable: once a `specs/NNN-*` directory exists, its number is never reused or reassigned.

