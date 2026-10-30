# Tasks: [FEATURE]

**Input**: spec.md, plan.md and the supporting artifacts needed by this feature.

Before tests, define correct behavior in spec.md’s core behavior matrix: files, main methods, conditions, expected results, correctness rationale and bugs rejected. Link BM IDs to the mapping below. Behavior/test contracts precede implementation; run static checks after a complete module, full units at task completion and full E2E only at feature/final completion. UI and browser coverage follows docs/testing.md. Do not make required tests optional because the feature prompt did not repeat project policy.

## Format

`- [ ] T001 [P?] [US1] [FR-001] Concrete action in exact/path`

[P] means no dependency or shared-file conflict. Task identifiers remain stable. Group work by independently verifiable user outcome; omit setup/foundational phases that the existing application does not need.

## US1 — [Outcome]

- [ ] T001 [US1] [FR-001] Complete affected spec matrix rows [BM-001], then add an independent failing behavioral contract in [exact test path]; justify its expectation; execute only at the completed task checkpoint when the import/API flow is ready.
- [ ] T002 [US1] [FR-001] Implement [behavior] in [owning source path] after T001; complete imports/exports/callers before static check.
- [ ] T003 [US1] [FR-001] Author/update real-browser coverage in [path] for the changed journey; execute the complete suite only at feature/final completion.

[Add only actual tasks. Generator work includes independent golden fixtures; schema changes include migration and old-file contracts.]

## Verification and completion

- [ ] T004 Run all unit tests at the completed task; focus only to repair a failure from that run. At final feature completion run the full configured E2E suite separately. Record row-linked rejection evidence, commands and limits.
- [ ] T005 Reconcile requirement coverage and task status; update affected docs/contracts.

## Dependencies

[Actual prerequisites and safe parallel opportunities; tests precede their implementation.]

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001 / US1 | T001–T003 | [test path / observable assertion] | [verification link after execution] |

Maintain this mapping here or in verification, not both. Mark completion only with evidence; do not claim unperformed manual checks.
