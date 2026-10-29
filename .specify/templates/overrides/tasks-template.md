# Tasks: [FEATURE]

**Input**: spec.md, plan.md and the supporting artifacts needed by this feature.

Before tests, define correct behavior in spec.md’s core behavior matrix: files, main methods, conditions, expected results, correctness rationale and bugs rejected. Link BM IDs to the mapping below. Tests-first is mandatory for domain, storage and generators, and for bug regressions. UI and browser coverage follows docs/testing.md. Do not make required tests optional because the feature prompt did not repeat project policy.

## Format

`- [ ] T001 [P?] [US1] [FR-001] Concrete action in exact/path`

[P] means no dependency or shared-file conflict. Task identifiers remain stable. Group work by independently verifiable user outcome; omit setup/foundational phases that the existing application does not need.

## US1 — [Outcome]

- [ ] T001 [US1] [FR-001] Complete affected spec matrix rows [BM-001], then add an independent failing behavioral contract in [exact test path]; justify its expectation and confirm the intended behavioral failure.
- [ ] T002 [US1] [FR-001] Implement [behavior] in [owning source path] after T001.
- [ ] T003 [US1] [FR-001] Add/update real-browser coverage in [path] for the changed user journey, or record why existing coverage suffices.

[Add only actual tasks. Generator work includes independent golden fixtures; schema changes include migration and old-file contracts.]

## Verification and completion

- [ ] T004 Verify which wrong variants the core tests actually reject (pre-fix regression or focused controlled probe), then run applicable checks at the completed logical checkpoint; record row-linked assertions, results and limits in verification.
- [ ] T005 Reconcile requirement coverage and task status; update affected docs/contracts.

## Dependencies

[Actual prerequisites and safe parallel opportunities; tests precede their implementation.]

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001 / US1 | T001–T003 | [test path / observable assertion] | [verification link after execution] |

Maintain this mapping here or in verification, not both. Mark completion only with evidence; do not claim unperformed manual checks.
