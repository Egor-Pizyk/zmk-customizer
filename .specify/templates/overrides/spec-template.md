# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[NNN-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: $ARGUMENTS

## Goal and scope

[User problem and observable result. Describe what and why, not implementation.]

**In scope**: [Included scenarios]
**Non-goals**: [Explicit exclusions]
**Existing contracts to preserve**: [Data compatibility, undo/redo, export, accessibility where relevant]

## User scenarios and acceptance

### US1 — [User outcome] (P1)

[Scenario, value and independent acceptance check]

1. Given [initial state], when [action], then [observable result].
2. Given [failure/boundary], when [action], then [recovery and preserved data].

[Add stories only when they represent distinct outcomes. Include keyboard/field alternatives for pointer gestures.]

## Requirements

- **FR-001**: [Testable product behavior linked to a story]

## Edge cases

[Boundary conditions, invalid input, cancellation, failure recovery and interactions with existing behavior relevant to this feature.]

## Core behavior test matrix

[Define correct behavior before tests/implementation. Follow docs/testing.md. Cover
core outcomes and relevant boundaries; reuse requirement IDs. File/method locations
may be pending at specification time but must be resolved from the plan before tests.
These references are traceability, not implementation design.]

| ID / requirement | Files (source and test) | Main methods / operations | Condition / input | Expected observable result | Why correct / independent source | Wrong variant / bug rejected |
|---|---|---|---|---|---|---|
| BM-001 / FR-001 | [owner; test] | [actual or planned operation] | [concrete case] | [observable result] | [requirement/invariant + independent derivation] | [plausible bug + distinguishing assertion] |

[Ask “Почему этот результат правильный?” for each expectation. Link matrix row IDs
to the existing task/test/evidence mapping. Record observed wrong-variant rejection
in verification; hypothetical bugs or green counts alone do not establish sensitivity.]

## Key entities

[Concepts and identity/relationships if needed; no implementation design. Omit if irrelevant.]

## Success criteria

- **SC-001**: [Measurable outcome verifiable from the acceptance scenarios]

## Assumptions and open questions

[Separate reasonable defaults from material questions requiring clarification. Resolve material uncertainty before planning.]
