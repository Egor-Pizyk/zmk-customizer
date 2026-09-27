<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (added Constraints item: target ZMK v0.3, ADR 0010)
- Previous: template (unversioned) → 1.0.0
- Modified principles: all template placeholders replaced by AGENTS.md §7 items I–VIII
- Added sections: Core Principles (8), Constraints, Development Workflow, Governance
- Removed sections: none
- Templates: .specify/templates/* not modified (read constitution at runtime; scope guard)
- Follow-up TODOs: none
-->

# ZMK Customizer Constitution

Derived from `AGENTS.md`. This document adds no principles of its own; `AGENTS.md` is the
source of truth (see Governance).

## Core Principles

### I. Correct Output Over Features

A generated file that does not build is worse than a missing feature. Every generator change
MUST come with a golden-file test (AGENTS.md §3.3).

Test: a change under `src/generators/` without a new or updated golden test is rejected.

Rationale: the product promise is ZMK files that build with upstream ZMK without manual edits.

### II. Domain First

Rules MUST live in `src/domain/` as pure functions with tests. UI only displays and dispatches;
components contain no ZMK rules.

Test: every invariant in AGENTS.md §2 is enforced by a tested domain function; no business
condition appears inline in `src/ui/`.

Rationale: rules in one pure layer are testable without a browser and cannot diverge between
screens.

### III. Static Only

No backend, no runtime network calls. The app MUST work offline after load.

Test: `src/` contains no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or analytics SDK;
export works with the network disabled.

Rationale: no accounts, no server storage, no telemetry (AGENTS.md §1.4); user data never
leaves the browser.

### IV. User Data Is Untrusted

Imported JSON and `localStorage` MUST be parsed with a schema in `src/storage/`; failure shows a
readable error and MUST never corrupt the current project.

Test: importing malformed, wrongly shaped or newer-`schemaVersion` input leaves the current
project deep-equal to before and shows a message naming the problem.

Rationale: a lost or damaged keyboard project is the worst failure the tool can cause.

### V. Every ZMK Option Explains Itself

Every user-toggleable ZMK option MUST show a short description and a link (`docsUrl`) to the
exact ZMK docs section. A catalog entry without a link is a bug.

Test: a catalog test fails if any user-toggleable entry lacks a description or `docsUrl`.

Rationale: users know keyboards, not Devicetree/Kconfig; the docs link is the path to
understanding.

### VI. Minimal Code

No abstractions for a single use, no config for values that never change, no speculative
folders or helpers. Delete before adding.

Test: review rejects single-implementation abstractions, unused exports, and folders created
before a file needs them.

Rationale: small code is easier to verify against ZMK and cheaper to change.

### VII. Deterministic

No `Math.random`, `Date.now` or iteration over unordered data in generators. Same input MUST
produce byte-identical output (stable ordering, fixed indentation, `\n` line endings, trailing
newline).

Test: generating twice from the same project yields identical bytes; golden tests compare
exact bytes.

Rationale: determinism makes golden-file diffs the debugging tool and keeps user repos free of
noise commits.

### VIII. Accessible

Every control MUST be keyboard reachable and labeled; the canvas MUST have a non-canvas
alternative (table/list) for key properties.

Test: each canvas operation has a keyboard or table equivalent, covered by a UI test where the
interaction is non-trivial.

Rationale: the tool must work without a mouse and with a screen reader.

## Constraints

- Architecture layers and dependency direction: AGENTS.md §3.1
  (`ui → storage → generators → domain ← catalog`). State model: §3.2. Generators: §3.3.
  Catalog data: §3.4.
- Tech stack and approved runtime dependencies: AGENTS.md §4. Any other dependency requires an
  ADR in `docs/decisions/`.
- Code-quality rules: files imported in AGENTS.md §10 (`docs/guidelines/code-quality/`).
- `make check` (typecheck + lint + format check + tests) MUST pass before any task is done.
- Generated output MUST target ZMK v0.3.0 ([ADR 0010](../../docs/decisions/0010-target-zmk-v0-3.md)).
  Anything marked "main only" in `docs/zmk/` MUST NOT be generated or offered in the UI.

## Development Workflow

From AGENTS.md §6 and §8:

- Features follow Spec Kit: specify → clarify → plan → tasks → analyze → implement. No feature
  code without a spec. Order and scope: `docs/roadmap.md`.
- Read the relevant `docs/zmk/*.md` page before touching anything that produces ZMK syntax. Do
  not write Devicetree/Kconfig from memory.
- Stay inside the task. No drive-by refactors, no renaming unrelated code, no new dependencies
  without AGENTS.md §4 approval.
- Tests first for domain logic and generators: write the test, watch it fail, then implement.
  Tests sit next to the code as `*.test.ts(x)`.
- One exported concept per file in `src/domain/` and `src/generators/`; files small and named
  after what they contain.
- No comments that repeat code. Comment only non-obvious "why" (ZMK quirks, links to docs).
- Never commit `dist/`, `coverage/`, `node_modules/`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`,
  `refactor:`), one logical change each.
- If a ZMK behavior is unclear, say so and link the doc page; do not guess.

## Governance

- `AGENTS.md` is the source of truth. When this constitution and `AGENTS.md` disagree,
  `AGENTS.md` wins and this constitution MUST be amended in the same change.
- Amendments: edit `AGENTS.md` first (if the rule changes), then this file, in one commit.
- Versioning (semver): MAJOR = principle removed or redefined incompatibly; MINOR = principle or
  section added or materially expanded; PATCH = wording and clarifications.
- Compliance: `/speckit.analyze` and the `spec-reviewer` agent check each feature against this
  constitution before `/speckit.implement`; `zmk-reviewer` checks generator and catalog changes;
  code review verifies the "review only" rules in the code-quality guidelines.

**Version**: 1.1.0 | **Ratified**: 2026-09-27 | **Last Amended**: 2026-09-27
