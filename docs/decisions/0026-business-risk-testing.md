# 0026. Business-risk test selection and aggregate coverage

Status: Accepted
Date: 2026-11-02

## Context
The owner requests fewer low-value tests and relief from near-total coverage floors.
Per-layer floors up to 100% reward tests of trivial helpers and presentation details.

## Decision
Partially supersede ADR0012 test selection/floors and ADR0015 per-layer floors.
Keep business invariants, data preservation, migrations, undo/redo, wiring, validation,
export bytes, critical keyboard access and regression tests with material impact.
Remove literal/copy/style snapshots, compiler duplication and trivial wrappers unless
an explicit risk justifies them. Test at the lowest effective level; integration/browser
coverage needs a distinct risk. No new test is required for an obvious implementation.
Measure domain, generators, storage and catalog parsing/lookups, excluding UI, tables,
indexes and types. Use aggregate 75% lines/statements, 70% functions, 65% branches;
no per-file/per-layer floors. docs/testing.md owns current selection and coverage policy.

## Consequences
Reports remain available; a green percentage alone does not establish correctness.
UI has no coverage quota; critical flows still retain behavioral regression tests.
Protected CI jobs remain; local scheduling follows ADR0027 and docs/testing.md.
No product behavior, schema or runtime dependency changes.
