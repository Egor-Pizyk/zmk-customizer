# Tasks: UI/UX research audit

## Delivery reconciliation — 2026-10-25

The user requested merging the remaining PRs after accepting 036. This delivers the bounded historical research/handoff, not a claim that every broad audit check passed. All R01–R23 were implemented or regression-verified in [036](../036-ui-ux-remediation/verification.md), merged as PR #24 and released as v0.5.0. Material behavior decisions were resolved in that feature. Historical observations below retain their original revision and limits. The proposed [038 review scope](../../docs/research/038-residual-ui-ux-scope.md) was subsequently cancelled by the user; 037 onboarding is next. Historical coverage limits remain disclosed; accepted 036 manual checks are not reopened. T005 remains an explicit unperformed broad-audit limitation; it does not represent an unresolved reproduced defect or block delivery of this research record.


**Input**: [spec](spec.md), [plan](plan.md), [research](research.md). Research only: no production or test-code changes.

## US1 — Understand actual workflow failures

- [x] T001 [US1] [FR-001, FR-011] Resolve 035, record baseline/method and UI/UX guidance in `plan.md`, `research.md`, `verification.md`.
- [x] T002 [US1] [FR-002, FR-003] Execute existing product journeys and bounded isolated probes; record environment, actual outcomes and gaps in `coverage.md` and `verification.md`.
- [x] T003 [US1] [FR-007] Compare report symptoms with source/owning contracts and runtime observations in `findings.md` without choosing unverified causes.

## US2 — Review presentation and access

- [x] T004 [US2] [FR-004–FR-006] Inspect actual light/dark screenshots, desktop/narrow panels, keyboard/state behavior in `coverage.md` and `findings.md`.
- [ ] T005 [US2] [FR-005, FR-006] Perform native OS keyboard/clipboard, screen-reader speech and native 200% zoom review; record actual environment/results in `coverage.md`. Keep open when unavailable.

## US3 — Accountable remediation handoff

- [x] T006 [US3] [FR-008–FR-010] Preserve all 21 original reports, classify evidence/priority/ownership and propose acceptance plus explicit decisions in `findings.md`.
- [x] T007 [US3] [FR-012] Summarize findings and unresolved checks/choices for 036 in `findings.md`; verify no silent backlog deferral.

## Verification and completion

- [x] T008 Validate documentation links/consistency and no code changes; run changed checks and update the existing draft PR with results in `verification.md`.
- [x] T009 Reconcile delivery scope and task status: historical handoff accepted for delivery by user request; broad audit limits remain explicit under T005 and the archived review proposal. No full audit completion is claimed.

## Dependencies and parallel opportunities

T001 → T002/T003/T004 → T006 → T007 → T008. T005 is an independent manual gate; T009 depends on it. Read-only source research for reports 1–10 and 11–21 can proceed independently; one agent owns artifact writes. No runtime application edits, mutation probes or new regression tests belong to this research stage. Future 036 fixes require tests-first under their own plan.

## Requirement coverage

| Requirements / story | Tasks | Check | Evidence |
|---|---|---|---|
| FR-001–003 / US1 | T001–002 | Recorded revision/environment; existing native-input journeys; explicit gaps | `coverage.md`, journal |
| FR-004–006 / US2 | T004–005 | Rendered screenshots, existing accessibility journeys; separate native manual checks | `coverage.md`, findings |
| FR-007–010 / US1, US3 | T003, T006 | 21 report IDs, evidence class, owner, impact, acceptance and decisions | `findings.md` |
| FR-011 / all | T001, T004 | Applicable skill guidance versus existing product rules | `research.md`, journal |
| FR-012 / US3 | T007–009 | Handoff, limits, no code changes and accurate completion | findings summary, journal |
