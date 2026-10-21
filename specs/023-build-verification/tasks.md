# Tasks: Build verification

## Setup

- [x] T001 Read pinned docs and verify official image/toolchain in specs/023-build-verification/research.md.

## US1 — Actual output builds (P1)

Independent test: actual export builds eight targets, malformed connector fails for its intended reason.

- [x] T002 [US1] Generate and validate deterministic board/polarity fixture repositories using real generators in scripts/generate-build-fixtures.mjs.
- [x] T003 [US1] Implement pinned west/Docker runner and artifacts in scripts/zmk-build.sh, scripts/zmk-build.env, compose.zmk.yaml and Makefile.
- [x] T004 [US1] Run eight smoke builds and intentional failure; record environment/logs and commands in specs/023-build-verification/research.md and quickstart.md.
- [x] T005 [US1] Add isolated required CI job with complete relevance inputs and pin-derived cache key in .github/workflows/ci.yml.

## Polish

- [x] T006 Verify make check, build tooling tests and generated artifacts ignore rules in .gitignore/.dockerignore; commit feature independently.

Dependencies: T001 → T002 → T003 → T004 → T005 → T006. MVP: US1. Generation and CI relevance tests can be developed independently after environment pins; actual builds are sequential to constrain memory.

## Local-only firmware verification — 2026-10-21

- [x] T007 Supersede T005: remove the CI firmware job and its required GitHub status; retain make zmk-build and pinned local tooling, align commands/testing/git-flow and roadmap, validate the workflow and record evidence. No generator/output or toolchain changes.

T007 evidence: [quickstart.md](quickstart.md#current-execution-policy--2026-10-21).
