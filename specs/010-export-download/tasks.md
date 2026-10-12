# Tasks: Export download

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/export.md, quickstart.md.
**Tests**: Required by AGENTS.md §8; observe failures before implementation.

## Phase 1: Setup

- [x] T001 Add approved fflate dependency to package.json/package-lock.json in Docker and refresh container dependencies.

## Phase 2: Foundation

- [x] T002 Write failure/cleanup tests for src/ui/download-blob.test.ts and preserve existing JSON download behavior.
- [x] T003 Implement src/ui/download-blob.ts and delegate src/ui/download-text-file.ts with optional MIME preserving application/json default.

## Phase 3: US1 Complete repository (P1)

**Goal**: Download exact complete repository; independent test is full preset extraction.

- [x] T004 [P] [US1] Author independent repository expectations and DIFFERENCES.md in tests/fixtures/generated/repository from 009 goldens and pinned template; add src/generators/generate-repository-files.test.ts for both workflow choices, rename and input immutability; observe failure.
- [x] T005 [US1] Add pinned revision/workflow data in src/catalog/shield-target.ts and implement src/generators/generate-repository-files.ts with root paths, config conf relocation and copied user keymap; no validation.
- [x] T006 [US1] Write src/storage/build-export-zip.test.ts extraction, sorted-order stability, changed clock and fixed metadata tests; observe failure.
- [x] T007 [US1] Implement src/storage/build-export-zip.ts using deferred fflate zipSync, level 6, local-calendar 1980-01-01 00:00:00 mtime, os 0/attrs 0, code-unit-sorted paths and owned bytes.
- [x] T008 [US1] Write pending lock/snapshot/download failure/retry tests in src/ui/export/use-export-actions.test.ts and update src/ui/export/export-workspace.test.tsx for exact preview, workflow choice and validation count; observe failure.
- [x] T009 [US1] Implement src/ui/export/use-export-actions.ts ZIP handler and src/ui/export/export-workspace.tsx workflow choice, composed preview, busy/disabled explanation and visible/announced feedback.

## Phase 4: US2 Single files (P2)

**Goal**: Exact copy/download of every preview; independent test is clipboard/download content comparison.

- [x] T010 [US2] Extend src/ui/export/use-export-actions.test.ts for Unicode clipboard success/denied/unavailable and text downloads/failures; extend src/ui/export/export-workspace.test.tsx for path labels; observe failure.
- [x] T011 [US2] Add single-file handlers in src/ui/export/use-export-actions.ts and copy/download buttons in src/ui/export/export-workspace.tsx; exact UTF-8 text/plain basename download, manual-copy error guidance.

## Phase 5: Polish and validation

- [x] T012 Review generator/catalog and fixtures using .claude/agents/zmk-reviewer.md; fix findings in scoped src/ and tests/ paths.
- [x] T013 Execute specs/010-export-download/quickstart.md where tools allow, record evidence/limitations in specs/010-export-download/validation.md and mark specified link in docs/roadmap.md.
- [x] T014 Run formatter, production build and required make check; record final results in specs/010-export-download/validation.md.

## Dependencies and parallel opportunities

T001 → T002 → T003. US1: T004 → T005 → T006 → T007 → T008 → T009. US2: T010 → T011 after foundation and shared UI. T012–T014 finish after both stories. T004 fixture authoring can run independently of foundation; generator and adapter tests touch separate files. UI mutations run sequentially. No delegated implementation required.

## Implementation strategy

Deliver repository download first; validate extraction and deterministic metadata before UI integration. Then add single-file actions. No deployment/commit/publication tasks. Every task is checkbox + ID + applicable story + concrete path.
