# Implementation Plan: Firmware Kconfig settings

**Branch**: `015-kconfig-settings` | **Spec**: [spec.md](spec.md)

## Technical context

Static React 19/TypeScript app; pure immutable Project; Zod storage trust boundary; deterministic generators; Vitest/Playwright; existing approved dependencies only. Schema v8 adds required `firmware` primitive override record; migration v7 initializes it empty. Catalog enters domain as arguments. No external services.

## Relevant context

Read AGENTS.md, docs/{product,principles,workflow,agent-rules,repository-map,architecture,folder-structure,tooling,domain-model,testing,commands}.md, specs/README.md and roadmap015; code-quality/{typescript,control-flow,observability,naming/functions,naming/variables}.md; frontend/{react,accessibility,admin-ui,tailwind}.md; src/styles.css; docs/zmk/{README,kconfig-options,shield-files}.md. Existing Project/storage contract: specs/002-project-foundation/contracts/project-file.md; current wiring/export contract: specs/013-matrix-wiring-editor/contracts/wiring.md. Owning modules: domain/types/project/analysis, catalog/firmware, storage/project/migrations, generators/{generate-conf,repository}, ui/{firmware,issues,shell,project}.

## Constitution check

Pass before and after design: pure domain and generators, no new dependency/network; v8 migration and old-file tests; pinned authoritative facts with independent output fixtures; labeled keyboard inputs and manual a11y gate; explicit tests-first sequence and browser saved/ZIP assertions. Preserve uncommitted014 edits. No principle change/ADR required.

## Design

Catalog defines FirmwareOption discriminated union (bool/int/enum/string), defaults, supported hardware, central-only routing and dependency requirements. Domain module `firmware` owns setting/reset/default resolution/value validation; UI searches display catalog and dispatches domain edits, reads shared analysis. `analyzeProject` receives catalog from composition and adds Firmware issues once. Project record accepts bounded primitives at storage boundary; unknown symbols/wrong semantic types become domain issues and remain removable. Malformed non-primitives fail parse atomically.

Firmware form groups catalog by category; reusable field renders native controls, descriptions/default/range/docs, inline issues and reset. Draft number/text commit blur/Enter, Escape cancels. Issues use existing data-issue-path focus; Firmware controls remain mounted when filtered using hidden sections; shared IssueButton dispatches a generic reveal-issue event before deferred focus; Firmware listens and clears its search before the next-frame focus. Hidden controls never serve as the reveal trigger. Unknown overrides render a resettable row.

`.conf` renderer resolves defaults against board/topology, removes equal overrides, renders choice members and escaped string values, sorts emitted symbols. Existing no-user-settings comment stays byte compatible. Shield hardware defaults stay untouched. On split, central-only overrides require per-half config files (left includes common + central, right common), suppressing shared config/name.conf; otherwise shared remains. USB boot and manufacturer are central-only in split. All generated files sorted deterministically.

## Verification strategy

Tests-first domain/storage/generator specs then implementation. Unit permutations include immutable no-op/history, dependencies, dynamic defaults, exact choice/string output, sorted overrides, legacy v1–v7 loads and malformed rejection. Rendered App covers controls, search, errors/focus and JSON persistence. Isolated browser native inputs and actual JSON/ZIP downloads cover cross-layer agreement in Chromium plus focused Firefox/WebKit. New scenarios run three times without retries; controlled saved-value regression proves sensitivity and exact restoration. Required make check, build, full E2E, make zmk-build. Manual keyboard/screen-reader/zoom/contrast gates remain pending explicit user authorization; never equate automation with manual.

Traceability is maintained in tasks.md only.
